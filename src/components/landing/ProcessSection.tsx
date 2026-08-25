const stats = [
  { value: "500+", label: "Active Sellers Onboard" },
  { value: "98%", label: "On-Time Delivery Rate" },
  { value: "40+", label: "Warehouses Connected" },
];

const steps = [
  {
    number: "01",
    title: "List Your Products",
    description:
      "Add products with weight and dimensions — we validate everything against our 85kg drone payload limit before it ever goes live.",
  },
  {
    number: "02",
    title: "Store & Manage Stock",
    description:
      "Hold inventory across any of our partner warehouses and track stock levels in one seller dashboard.",
  },
  {
    number: "03",
    title: "Automated Drone Assignment",
    description:
      "Orders are batched and routed to the nearest available drone using real-time route and capacity optimization.",
  },
  {
    number: "04",
    title: "Real-Time Tracking",
    description:
      "You and your buyers follow every delivery live, from warehouse pickup to doorstep drop-off.",
  },
];

export default function ProcessSection() {
  return (
    <section id="about" className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
      <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
        <h2 className="max-w-md text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Smart Logistics for a Growing Seller Network
        </h2>
        <dl className="flex flex-wrap gap-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {stat.value}
              </dt>
              <dd className="mt-1 max-w-[10rem] text-sm text-slate-500">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-100 transition hover:ring-slate-200"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white">
              {step.number}
            </span>
            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
