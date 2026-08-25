# Getting Started

## Requirements

- Node.js 20+
- npm

## Install & run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

| Route | What it is |
|---|---|
| `/` | Public marketing landing page |
| `/seller/login`, `/seller/register` | Seller sign-in / apply-to-sell |
| `/seller` | Seller dashboard (after "signing in") |
| `/admin/login` | Admin sign-in |
| `/admin` | Admin dashboard (after "signing in") |

Login/register don't check a real password — any non-empty input that passes the form's validation will redirect you in. See [`design.md`](./design.md#demo-mode) for why.

## Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Where to look next

- [`structure.md`](./structure.md) — route tree, folder layout, where a given page/component lives
- [`design.md`](./design.md) — brand, colors, typography, component conventions
- [`data-model.md`](./data-model.md) — the TypeScript types and mock data that power every page
- [`algorithms.md`](./algorithms.md) — the four admin "algorithm console" pages and the real pathfinding/optimization code behind them
- [`SmartLogix_Two_Site_Structure_Guide.md`](./SmartLogix_Two_Site_Structure_Guide.md) — the original product spec this app was built from
- [`SmartLogix_IDSS_Detailed_Design_Document.pdf`](./SmartLogix_IDSS_Detailed_Design_Document.pdf) — the original coursework design document (the 5 algorithm modules, evaluation methodology)

## Project status: this is a front-end demo

There is no backend. No Supabase, no auth provider, no database. Every list, table, and chart in `/seller` and `/admin` reads from static TypeScript files in `src/lib/mock-data/`, and every "write" (approve a seller, add a product, override a drone) only mutates React state in memory — it resets on page reload. This is called out in-app via the "Demo mode" label in both dashboard top bars. See [`data-model.md`](./data-model.md) for the full picture of what's real vs. mocked.
