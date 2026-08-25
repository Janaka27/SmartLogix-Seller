import Image from "next/image";

const services = [
  {
    title: "Drone Delivery Network",
    description: "Fast, autonomous last-mile delivery for every order.",
    image:
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Warehouse & Fulfillment",
    description: "Store inventory across our partner warehouse network.",
    image:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Seller Dashboard & Analytics",
    description: "Track sales, stock, and payouts in one place.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Smart Route Optimization",
    description: "Every flight planned for the fastest, safest path.",
    image:
      "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Services() {
  return (
    <section id="services" className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.title}
            className="group relative h-64 overflow-hidden rounded-2xl"
          >
            <Image
              src={service.image}
              alt={service.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="text-lg font-semibold text-white">
                {service.title}
              </h3>
              <p className="mt-1 text-sm text-white/75">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
