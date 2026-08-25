const partners = [
  "NorthPoint Freight",
  "Pilot Cargo",
  "TruckWave",
  "NextMile",
  "Expressly",
  "AeroDock",
];

export default function TrustedBy() {
  return (
    <section className="w-full border-y border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-400">
          Trusted by logistics partners across the network
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {partners.map((name) => (
            <span
              key={name}
              className="text-lg font-bold tracking-tight text-slate-300 transition hover:text-slate-500"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
