import Image from "next/image";
import Navbar from "./Navbar";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative w-full overflow-hidden rounded-b-[2.5rem] bg-slate-900 sm:mx-4 sm:mt-4 sm:w-auto sm:rounded-[2rem] lg:mx-6 lg:mt-6"
    >
      <Navbar />

      <div className="relative h-[640px] w-full sm:h-[600px]">
        <Image
          src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=2000&q=80"
          alt="Aerial view of a container ship at sea"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/40 to-slate-900/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        <div className="relative z-10 flex h-full max-w-7xl flex-col justify-center px-6 pt-24 lg:mx-auto lg:px-8">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sell Smarter With Drone-Powered Delivery
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
              List your products, store them across our warehouse network,
              and let SmartLogix handle the rest — automated routing,
              real-time drone tracking, and delivery in minutes, not days.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/seller/register"
                className="rounded-full bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400"
              >
                Become a Seller
              </a>
              <a
                href="#services"
                className="rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className="absolute right-6 top-1/2 hidden w-72 -translate-y-1/2 items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-md sm:flex lg:right-0">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image
                src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=300&q=80"
                alt="Delivery drone in flight"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div>
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full bg-orange-400 ring-2 ring-slate-900" />
                <div className="h-6 w-6 rounded-full bg-blue-400 ring-2 ring-slate-900" />
                <div className="h-6 w-6 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <p className="mt-1.5 text-sm font-semibold text-white">
                500+ Sellers
              </p>
              <p className="text-xs leading-snug text-white/70">
                Growing their reach on the SmartLogix network
              </p>
            </div>
          </div>

          <a
            href="#about"
            className="absolute bottom-8 right-6 hidden h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10 sm:flex lg:right-0"
            aria-label="Scroll down"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 4v16m0 0-6-6m6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
