import Image from "next/image";

const features = [
  {
    title: "Fast & Secure Delivery",
    description:
      "Orders depart within minutes of batching, tracked and insured every step of the flight.",
    icon: (
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Flexible Warehouse Storage",
    description:
      "Store your stock across multiple warehouses and let us route from whichever is closest to the buyer.",
    icon: (
      <path
        d="M4 10 12 4l8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z M9 20v-6h6v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "24/7 Tracking & Support",
    description:
      "Live drone position, delivery status, and a support team on call around the clock for you and your buyers.",
    icon: (
      <path
        d="M12 22c5-1 9-4 9-9V7l-9-5-9 5v6c0 5 4 8 9 9Z M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900">
          <div className="relative h-full min-h-[420px] w-full">
            <Image
              src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1200&q=80"
              alt="Parcels staged and ready for delivery"
              fill
              className="object-cover opacity-80"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Why Sell With SmartLogix?
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
              We combine a growing drone fleet, real-time visibility, and
              optimized routing so your orders move smarter, not slower.
            </p>
            <a
              href="#contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              Get Started
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-white p-6 ring-1 ring-slate-100"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  {feature.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
