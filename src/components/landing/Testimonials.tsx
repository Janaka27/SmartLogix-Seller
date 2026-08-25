"use client";

import Image from "next/image";
import { useState } from "react";

const testimonials = [
  {
    quote:
      "We've been selling on SmartLogix for six months, and our delivery times dropped from two days to under an hour. Our customers notice the difference.",
    name: "Jenna Torri",
    role: "Owner, Torri Home Goods",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote:
      "The seller dashboard makes it effortless to manage stock across three warehouses. Payouts are always on time, and support actually picks up.",
    name: "Marcus Lee",
    role: "Founder, Lee Electronics",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote:
      "Live drone tracking gives our buyers real confidence at checkout. Cart abandonment on delivery-sensitive items dropped noticeably.",
    name: "Amara Chen",
    role: "Operations Lead, Chen Outdoor",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const active = testimonials[index];

  const prev = () =>
    setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <section
      id="testimonials"
      className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8"
    >
      <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Trusted Worldwide by Sellers
      </h2>

      <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <p className="text-lg leading-relaxed text-slate-600">
            &ldquo;{active.quote}&rdquo;
          </p>
          <p className="mt-6 text-base font-semibold text-slate-900">
            {active.name}
          </p>
          <p className="text-sm text-slate-500">{active.role}</p>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Previous testimonial"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-400"
              aria-label="Next testimonial"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative overflow-hidden rounded-2xl ring-2 transition ${
                i === index
                  ? "h-28 w-28 ring-orange-500"
                  : "h-20 w-20 ring-transparent opacity-70"
              }`}
              aria-label={`Show testimonial from ${t.name}`}
            >
              <Image
                src={t.image}
                alt={t.name}
                fill
                className="object-cover"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
