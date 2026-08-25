# Design System

## Brand

### Logo

Three logo files, all transparent-background PNGs at `public/images/`:

| File | Wordmark color | Use |
|---|---|---|
| `logo.png` | dark slate | on light surfaces, used directly |
| `logo-white-text.png` | white | on dark surfaces, used directly — no background chip needed |
| `logo-mark.png` | — (arrow only, no wordmark) | compact/icon slots |

- **Light backgrounds** (`Footer.tsx`) — `logo.png` used as-is.
- **Hero / Navbar** (`Navbar.tsx`, sits over the dark hero image) — `logo-white-text.png` used directly, no wrapper.
- **`AuthShell.tsx`** (dark `bg-slate-950`) — still uses `logo.png` wrapped in a small white rounded pill; swap to `logo-white-text.png` directly (dropping the pill) if the same treatment as the navbar is wanted there too.
- **Sidebar header** (`AppSidebar.tsx`) — uses `logo-mark.png`, a pre-cropped square-ish version containing just the orange arrow (no wordmark), on a small white chip, with "SmartLogix" set as real text next to it. This is deliberate, not an oversight: the sidebar's `collapsible="icon"` mode shrinks its header button to an 8×8 square and relies on `overflow-hidden` to clip everything but a small icon — a wide wordmark image would clip awkwardly, while a square mark + separate text label degrades cleanly (the text just disappears, same as it always did).

If the source logo file is ever replaced, regenerate `logo-mark.png` by cropping just the mark region (the gap between mark and wordmark is easy to find by scanning column alpha values — see git history for the exact crop script used).

One accent color, used consistently everywhere: **orange-500** (Tailwind's `orange-500`) — it's also the mark's own color. It's the CTA color on the landing page and is also wired into shadcn's `--primary` token, so every dashboard button, active nav item, focus ring, and progress bar picks it up automatically — there's no second accent color anywhere in the app.

Dark surfaces (the landing page's navbar/footer/hero overlay, and both dashboards' sidebar) use **slate-900/800**. This is deliberate: the sidebar is retinted dark in `globals.css` specifically so `/seller` and `/admin` feel like the same product as the landing page, not a bolted-on admin template.

| Role | Badge color |
|---|---|
| Seller portal | slate |
| Admin portal | orange |

Corners are rounded generously — `rounded-2xl`/`rounded-3xl` on the landing page's cards, and shadcn's `--radius` bumped to `0.85rem` (from the default `0.625rem`) so dashboard `Card`/`Dialog`/`Sheet` components match that same rounder language.

## Typography

**Outfit**, loaded via `next/font/google` in `src/app/layout.tsx` (a true variable font, so no explicit `weight` array is needed), mapped to the `--font-sans` CSS variable that both Tailwind's `font-sans` utility and shadcn's `--font-heading` alias resolve to. `Geist_Mono` is still loaded for `--font-mono` (available via `font-mono`, not currently used anywhere prominent).

To change the type family again: edit the `Outfit({...})` call in `layout.tsx` — nothing else references a font by name.

## Color tokens

`src/app/globals.css` is shadcn's generated token file (oklch-based, `:root` for light mode, `.dark` for dark mode) with these deliberate overrides on top of the shadcn default:

| Token | Value | Why |
|---|---|---|
| `--primary` / `--ring` | `var(--color-orange-500)` | ties every interactive shadcn component to the brand accent |
| `--radius` | `0.85rem` | matches the landing page's rounder card language |
| `--sidebar` | `var(--color-slate-900)` | keeps the dashboard sidebar dark like the landing page's nav/footer |
| `--sidebar-accent` | `var(--color-slate-800)` | hover/active state inside the dark sidebar |
| `--chart-1..5` | orange/slate mix | recharts palette used by `ChartContainer` |

Everything references Tailwind v4's own generated palette variables (`var(--color-orange-500)`, `var(--color-slate-800)`, etc.) rather than hand-picked oklch numbers, so retinting stays a one-line change and always matches the real Tailwind color it names.

**Dark mode is defined but not activated** — no theme toggle exists yet. The `.dark` class token block is there for when one is added; today the app is light-mode-only.

The public landing page (`src/components/landing/*`) does **not** use these tokens — it's hardcoded Tailwind utility classes (`bg-orange-500`, `bg-slate-900`, etc.) written before shadcn was introduced. Keep it that way; retinting the token layer must never visually change `/`.

## Component conventions

- **Shared dashboard primitives** (`src/components/dashboard/`): `PageHeader`, `StatCard`, `StatusBadge`, `EmptyState`, `DataTableToolbar`. Reach for these before writing a one-off — every existing dashboard page uses them, and `StatusBadge` in particular is the single place every status-enum-to-color mapping lives (order/drone/seller/product/payout/assignment/admin-user statuses all go through it).
- **Forms**: `react-hook-form` + `zod`, hand-built per form (see the "note on the UI kit" in [`structure.md`](./structure.md)). Look at `src/components/seller/ProductFormDialog.tsx` for the fullest example (text/number fields via `register()`, a `Select` and a `Switch` via `Controller`, live-computed derived state via `watch()`).
- **Dialogs vs. Sheets**: `Dialog` for create/edit forms (Add Product, Add Warehouse, Add Drone, Invite User); `Sheet` for read-only detail drill-ins (order detail on `/seller/orders`).
- **Tables**: shadcn `Table` + `DataTableToolbar` for search/filter/actions, `StatusBadge` for any status column, `EmptyState` for the zero-results case.
- **Algorithm consoles**: `GraphCanvas` (`src/components/algorithms/GraphCanvas.tsx`) is the one reusable inline-SVG node/edge renderer shared by the Network Analysis, Route Optimization, and Delivery Batching consoles. `recharts` (via shadcn's `ChartContainer`) is reserved for actual statistical charts (SA convergence, benchmarks) — no separate graph-layout library is used.

## Demo mode

Both dashboard top bars show a small "Demo mode — changes aren't saved" label (`src/components/dashboard/Topbar.tsx`). This isn't a design flourish to remove — it's accurate: there's no backend, so every mutation (approve a seller, edit a product, override a drone) only updates in-memory React state. See [`data-model.md`](./data-model.md) for what's real vs. mocked.
