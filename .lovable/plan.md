# Plan: Payment QR Popup in Billing Flow

## Goal
After a bill is confirmed, show a clean, mobile-optimized modal with a large QR-code placeholder, the bill total, and a compact bill summary — before the billing flow ends. This is UI preparation only: no real UPI/Razorpay/API/QR generation, no fake success states. The existing stock-deduction and sale-save logic stays untouched.

## Current flow (src/pages/Billing.tsx)
- User taps **Bill** → bottom `Sheet` opens with bill summary + **Confirm** / **Clear**.
- `handleConfirmSale()`: deducts stock (FIFO via `batchHelpers`), saves `Sale`, clears `billItems`, closes sheet, toasts success.

## Change
Confirm still runs the exact existing logic (stock deduction, sale save). The only addition: **capture a snapshot of the bill before clearing**, then open a new QR popup with that snapshot. The popup is purely visual.

```
Confirm  →  handleConfirmSale (unchanged: deduct + save sale)
        →  snapshot {items, total} captured before billItems cleared
        →  close Sheet, open PaymentQrPopup with snapshot
        →  Close/Cancel  →  popup closes, billing flow ends
```

## New file: src/components/PaymentQrPopup.tsx
Reusable component so a real UPI QR can be wired in later without redesigning.

Props:
- `open: boolean`
- `onClose: () => void`
- `items: SaleItem[]`  (name, quantity, price, subtotal)
- `totalAmount: number`

Built on the existing `Dialog` primitive (already has dimmed `bg-black/80` overlay, centered, animated). No new visual system.

Layout (theme tokens only — `bg-background`, `border-border`, `text-foreground`, `text-muted-foreground`, `--radius`):

```
┌──────────────────────────────┐
│        Scan to Pay       [X] │   ← DialogTitle
│                              │
│        ┌────────────┐        │
│        │            │        │   ← Square QR placeholder
│        │  [QR icon] │        │     (bordered square, dashed grid,
│        │   "QR"     │        │      not scannable, no real data)
│        └────────────┘        │
│                              │
│        Total:  ₹ 350         │   ← prominent total near QR
│   ──────────────────────    │
│   item1   2 × ₹50    ₹100    │   ← compact summary
│   item2   1 × ₹250   ₹250    │     (scrollable if long)
│   ──────────────────────    │
│       [ Cancel / Close ]     │
└──────────────────────────────┘
```

QR placeholder detail:
- A separate inner `<QrPlaceholder>` sub-block (own bordered square, aspect-square, max ~220px), styled to *look like* a QR area but containing only a decorative grid + a small "QR" / scan icon + helper text. Clearly not a real QR.
- Structured so a future `children`/prop swap (e.g. `<img src={upiQr} />`) replaces only the inner area; layout and summary stay identical.

Responsive / mobile portrait:
- Dialog is already `max-w-lg` centered; on mobile it's near full-width.
- Vertical stack: QR on top, total, then summary below — never horizontal squeeze.
- Inner summary uses `max-h` + `overflow-y-auto` so a long bill never overflows.
- Reuses the existing `@media (max-width: 639px)` dialog font-scaling from `index.css`.
- Close button large enough (≥44px tap target) per project mobile rules.

## Edit: src/pages/Billing.tsx
- Import `PaymentQrPopup`.
- Add state: `qrOpen` (bool), `qrSnapshot` (`{ items: SaleItem[]; totalAmount: number } | null`).
- In `handleConfirmSale`, **before** `setBillItems([])`:
  - `setQrSnapshot({ items: billItems, totalAmount });`
  - After existing logic, `setQrOpen(true)` (sheet already closes via existing `setIsSheetOpen(false)`).
- Keep `setBillItems([])` so the billing sheet is empty/closed — popup uses the snapshot.
- Render `<PaymentQrPopup open={qrOpen} onClose={() => { setQrOpen(false); setQrSnapshot(null); }} items={qrSnapshot?.items ?? []} totalAmount={qrSnapshot?.totalAmount ?? 0} />` at the page root.
- No changes to billing calculations, FEFO/FIFO deduction, or sale saving.

## Out of scope (explicitly NOT doing)
- No real QR generation, UPI deep-link, Razorpay, or any payment API.
- No backend, auth, or payment-success state.
- No duplicate billing logic — popup reads the snapshot of the real bill only.

## Verification
- Build passes.
- Manual (Playwright, mobile viewport): add 2 items → Bill → Confirm → QR popup appears with correct total + item list, sheet closed. Close button dismisses popup. Stock already deducted and sale saved (matches current behavior).
