# Product Images for Inven³

Add an optional photo to each product (products only — not batches, not categories), stored offline in the browser like the rest of your data.

## What you get

1. **Add/change photo popup**
   - A small dialog with a large "Choose Photo" / "Take Photo" button (uses the phone camera on mobile), a preview of the picked image, and Save / Remove / Cancel buttons.
   - Opened from the product card's ⚙️ menu as "Add Photo" (or "Change Photo" if one exists), and available from the Edit Product dialog too.

2. **Photo on the product card**
   - Small square thumbnail (about 44px mobile / 56px desktop) at the left of the product name in the Stock section.
   - Products without a photo show a neutral placeholder icon, so cards stay the same size.
   - Existing layout, alerts, badges, and batch section stay exactly as they are.

3. **Photo in Billing rows**
   - Same small thumbnail before the product name so items are easier to recognize while billing. Billing logic (FIFO deduction, totals) unchanged.

4. **Offline-safe storage**
   - The picked image is resized down (max ~400px, JPEG ~0.7 quality) in the browser before saving, so localStorage stays small and the app stays fast on low-end phones.
   - Files over ~5MB are rejected with a friendly toast; if storage is full, a clear message appears instead of a silent failure.

## Technical details

- `src/types/product.ts`: add optional `imageUrl?: string` (base64 data URL) to `Product`.
- New `src/components/ProductImageDialog.tsx`: `<input type="file" accept="image/*" capture="environment">`, canvas-based resize/compress helper, preview, Save/Remove.
- New `src/utils/imageHelpers.ts`: `resizeImageFile(file, maxSize, quality): Promise<string>`.
- `src/components/StockProductCard.tsx`: thumbnail + dropdown menu item that opens the dialog and calls existing `onUpdateProduct` with `{ ...product, imageUrl }`.
- `src/components/EditProductForm.tsx`: small thumbnail button that opens the same dialog; keeps the compact mobile layout.
- `src/pages/Billing.tsx`: render thumbnail in each product row.
- No backend, no login; images persist in localStorage with products.

## How to change card details yourself (manual editing guide)

For each area, the file to edit and what lives there:

| What you want to change | File |
| --- | --- |
| Stock product card layout, text, badges, ⚙️ menu items | `src/components/StockProductCard.tsx` |
| Fields in the Edit Product popup | `src/components/EditProductForm.tsx` |
| Fields in the Add Product popup | `src/components/AddProductForm.tsx` |
| Batch list rows / batch popup | `src/components/BatchCard.tsx`, `src/components/BatchManagement.tsx` |
| Billing rows, totals, search | `src/pages/Billing.tsx` |
| Stock page grouping/accordion, search | `src/pages/Index.tsx` |
| Colors, fonts, global styles | `src/index.css` + `tailwind.config.ts` |
| Alert thresholds, toggles | `src/pages/Settings.tsx`, `src/hooks/useSettings.ts` |

To add a brand-new field to a product (e.g. "Supplier"):
1. Add `supplier?: string;` to `Product` in `src/types/product.ts`.
2. Add an `Input` for it in `AddProductForm.tsx` (include it in the `formData` state and in the `onAdd(...)` payload).
3. Add the same `Input` in `EditProductForm.tsx` and include it in the `updatedProduct` object.
4. Display it in `StockProductCard.tsx` wherever you want the text to appear.

Everything is saved through `useLocalStorage`, so no database changes are ever needed — a new field just starts appearing once you set it. Existing products simply have it empty.
