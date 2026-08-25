# Project Structure

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI primitives, not Radix).

## Top-level layout

```
src/
  app/            routes (Next.js App Router)
  components/
    ui/           shadcn/ui primitives — generated, treat as vendored
    landing/      the public marketing page (/)
    dashboard/    shared shell used by both /seller and /admin
    auth/         shared shell used by the login/register pages
    algorithms/   GraphCanvas — the node/edge visualization used by 3 admin consoles
    seller/       dialogs specific to the seller portal (product form, bulk stock)
    admin/        dialogs specific to the admin portal (warehouse, drone, invite-user forms)
  lib/
    types.ts          every domain type (Product, Order, Drone, ...)
    mock-data/         static seed data for every entity, cross-referenced by id
    algorithms/         the real pathfinding/optimization code (see algorithms.md)
    nav-config.ts        sidebar nav items for each portal
    format.ts             currency/date/weight/distance formatters
    utils.ts               shadcn's cn() helper
  hooks/
    use-mobile.ts    shadcn-generated
docs/               you are here
```

## Routes

### `/` — Landing page
`src/app/page.tsx` composes the components in `src/components/landing/`: `Hero`, `ProcessSection`, `TrustedBy`, `Services`, `WhyChooseUs`, `Testimonials`, `FAQ`, `CTABanner`, `Footer`, with `Navbar` inside `Hero`. Its "Become a Seller" / "Get Started" CTAs link to `/seller/register`.

### `/seller` — Seller portal
Route group split: `(auth)` has no sidebar, `(dashboard)` has the full shell.

```
src/app/seller/
  (auth)/
    layout.tsx              centered card, no sidebar (AuthShell role="seller")
    login/page.tsx           /seller/login
    register/page.tsx        /seller/register — "apply to sell" form + success panel
  (dashboard)/
    layout.tsx               SidebarProvider + AppSidebar(role="seller") + Topbar
    page.tsx                  /seller — dashboard home (KPIs, sales chart, low stock, recent orders)
    inventory/page.tsx        /seller/inventory — Products tab (catalog, add/edit, bulk stock) + By Warehouse tab
    orders/page.tsx           /seller/orders — order list + detail sheet + packed→ready toggle
    earnings/page.tsx         /seller/earnings — payout history
    settings/page.tsx         /seller/settings — store profile + connected warehouses
```

There is no `/seller/products` route — product management lives inside the Products tab of `/seller/inventory` (see the "Products tab" note in [`data-model.md`](./data-model.md)).

### `/admin` — Admin portal
Same route-group pattern.

```
src/app/admin/
  (auth)/
    layout.tsx
    login/page.tsx           /admin/login (no self-registration — see below)
  (dashboard)/
    layout.tsx               SidebarProvider + AppSidebar(role="admin") + Topbar
    page.tsx                  /admin — system-wide KPIs
    sellers/page.tsx          /admin/sellers — approve/reject/suspend
    warehouses/page.tsx       /admin/warehouses — add/edit
    drones/page.tsx           /admin/drones — 4-column status board + manual override
    users/page.tsx            /admin/users — invite/disable admin staff
    network/page.tsx          /admin/network — Prim's MST console
    routes/page.tsx           /admin/routes — Dijkstra / A* / Bellman-Ford console
    batching/page.tsx         /admin/batching — knapsack + simulated annealing console
    decision/page.tsx         /admin/decision — feasibility classifier console
    benchmarks/page.tsx       /admin/benchmarks — charts over benchmark_logs
    cms/page.tsx               /admin/cms — landing page copy editor (cosmetic only)
```

There's no `/admin/register` — admin/staff accounts are provisioned by a super admin from `/admin/users`, not self-service.

## Sidebar nav

`src/lib/nav-config.ts` exports `sellerNavGroups` and `adminNavGroups`, each an array of `{ label, items: { title, href, icon }[] }`. `AppSidebar` (`src/components/dashboard/AppSidebar.tsx`) renders whichever one matches its `role` prop. Add a new page to a portal by adding one entry here — that's the single source of truth the sidebar reads from.

## Shared dashboard shell

Both portals' `(dashboard)/layout.tsx` compose the same three pieces:

- `AppSidebar` (`role="seller" | "admin"`) — brand mark, role badge (slate for seller, orange for admin), nav, mock logged-in user footer
- `Topbar` — breadcrumb (derived from the URL path), the "Demo mode" indicator, notification bell, user menu
- `<main className="p-6">{children}</main>`

Every page body then opens with `PageHeader` (`title`, `description`, optional `actions`) for a consistent title row, and reuses `StatCard`, `StatusBadge`, `EmptyState`, and `DataTableToolbar` from `src/components/dashboard/` wherever it needs a KPI tile, a status pill, a zero-results state, or a search+filter+actions row.

## A note on the UI kit

`components.json` shows this project's shadcn/ui is on the **Base UI** flavor (`@base-ui/react`), not the more common Radix-based shadcn. Two things that trip people up coming from Radix-based shadcn:

- Polymorphic components take a `render={<Link href="..." />}` prop instead of an `asChild` + child element pattern.
- `Button` defaults to `nativeButton={true}` and will warn if you `render` it as a non-`<button>` element (e.g. a `Link`) — pass `nativeButton={false}` in that case. Search the codebase for `nativeButton={false}` to see existing examples.
- This shadcn version's `form` registry component is currently broken (returns an empty `registry-item.json`). Forms in this repo are hand-built with `react-hook-form` + `zod`, using `Controller` for the Base UI–driven `Select`/`Switch`/`Checkbox` fields and plain `register()` for text/number inputs — there is no generic `<Form>`/`<FormField>` wrapper here.
