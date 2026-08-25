# SmartLogix-Seller Docs

This is Site B — the **Seller & Admin Portal** — of the two-site drone-delivery marketplace described in [`SmartLogix_Two_Site_Structure_Guide.md`](./SmartLogix_Two_Site_Structure_Guide.md). It's a Next.js app with a public marketing landing page (`/`), a seller dashboard (`/seller`), and an admin dashboard (`/admin`), including four consoles that run real pathfinding/optimization algorithms client-side.

**Start here:** [`getting-started.md`](./getting-started.md)

| Doc | What's in it |
|---|---|
| [`getting-started.md`](./getting-started.md) | Install, run, scripts, what "demo mode" means |
| [`structure.md`](./structure.md) | Route tree, folder layout, the shared dashboard shell, shadcn/Base UI gotchas |
| [`design.md`](./design.md) | Brand, colors, typography (Poppins), component conventions |
| [`data-model.md`](./data-model.md) | Every TypeScript type, the mock data that seeds each page, what's real vs. in-memory-only |
| [`algorithms.md`](./algorithms.md) | The four `/admin` algorithm consoles and the real Dijkstra/A*/Bellman-Ford/Prim's/Knapsack/Simulated-Annealing code behind them |
| [`SmartLogix_Two_Site_Structure_Guide.md`](./SmartLogix_Two_Site_Structure_Guide.md) | The original product spec (page lists, DB schema) this app was built from |
| [`SmartLogix_IDSS_Detailed_Design_Document.pdf`](./SmartLogix_IDSS_Detailed_Design_Document.pdf) | The original coursework design document |

## The one thing to know going in

**There is no backend.** Every page in `/seller` and `/admin` is powered by static mock data (`src/lib/mock-data/`), and every button that looks like it saves something only updates in-memory React state — it resets on reload. This is intentional and labeled in-app ("Demo mode"). Full details in [`data-model.md`](./data-model.md).
