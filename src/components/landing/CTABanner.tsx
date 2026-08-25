export default function CTABanner() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-8">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-slate-900 px-8 py-14 text-center sm:px-16">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Sell Faster With SmartLogix?
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
          Join hundreds of sellers already using our drone delivery network
          to get orders to buyers in minutes.
        </p>
        <a
          href="#contact"
          className="rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400"
        >
          Become a Seller Today
        </a>
      </div>
    </section>
  );
}
