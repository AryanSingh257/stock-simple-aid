# Inven3

Simple inventory management application designed for shopkeepers and small business owners. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Product Management** — Add, edit, delete, and search products with support for categories
- **Batch Tracking** — Manage stock in batches with expiry dates and FEFO (First Expired First Out) logic
- **Billing / POS** — Create sales bills with automatic stock deduction and real-time totals
- **Sales History** — Track all sales and stock adjustments with timestamps
- **Expiry Alerts** — Get notified about products nearing expiry or already expired
- **Low Stock Alerts** — Configurable threshold warnings when stock runs low
- **Category Grouping** — Organize products by category with collapsible accordion views
- **Stock Adjustment** — Manually adjust stock levels with logging
- **Local Storage Persistence** — All data stored locally in the browser, no backend required

## Tech Stack

- [React](https://react.dev/) 18 — UI framework
- [TypeScript](https://www.typescriptlang.org/) — Type-safe development
- [Vite](https://vite.dev/) — Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [shadcn/ui](https://ui.shadcn.com/) — Component library
- [TanStack Query](https://tanstack.com/query) — Data fetching and caching
- [React Router](https://reactrouter.com/) — Client-side routing
- [Zod](https://zod.dev/) — Schema validation
- [React Hook Form](https://react-hook-form.com/) — Form management
- [Recharts](https://recharts.org/) — Charting library
- [Lucide React](https://lucide.dev/) — Icons

## Getting Started

### Prerequisites

- Node.js >= 18
- npm (or yarn / pnpm)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd Inven3

# Install dependencies
npm install
```

### Development

```sh
# Start the development server with hot reload
npm run dev
```

### Build

```sh
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

### Lint

```sh
# Run ESLint
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── AddProductForm.tsx
│   ├── AddCategoryForm.tsx
│   ├── BatchManagement.tsx
│   ├── Billing/
│   ├── Navigation.tsx
│   ├── SearchBar.tsx
│   ├── StockAdjustmentDialog.tsx
│   └── ...
├── pages/
│   ├── Index.tsx           # Dashboard / product list
│   ├── Billing.tsx         # POS / billing page
│   ├── SalesHistory.tsx    # Sales and adjustment history
│   ├── Settings.tsx        # App settings
│   └── NotFound.tsx
├── hooks/
│   ├── useLocalStorage.ts  # Persistent storage hook
│   ├── useSettings.ts      # Settings management
│   └── useToast.ts
├── types/
│   ├── product.ts
│   ├── batch.ts
│   ├── category.ts
│   └── sale.ts
├── utils/
│   ├── batchHelpers.ts     # FEFO logic and batch calculations
│   └── productHelpers.ts   # Sorting and filtering utilities
├── App.tsx
└── main.tsx
```

## Key Concepts

### Batches & FEFO

Products can be split into batches, each with its own expiry date. When a product is sold, stock is deducted from the **earliest expiring batch first** (FEFO), ensuring older or near-expiry stock is sold before fresher stock.

### Stock Adjustment

Stock can be manually increased or decreased. Decreases are logged as `adjustment` sales records, while increases create new production batches with configurable expiry durations.

### Local Storage

All data persists in the browser via `localStorage`. No server or database is required — the app works entirely offline once loaded.

## Configuration

Settings are accessible from the Settings page and include:

- **Low stock threshold** — warning level for minimum stock quantity
- **Expiry alert days** — days before expiry to show a warning
- **Category grouping** — toggle to group products by category in the product list
