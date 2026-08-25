"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What is SmartLogix's drone tracking system?",
    answer:
      "Every order gets a live map view once it's assigned to a drone, updating in real time from warehouse pickup through to delivery at the buyer's door.",
  },
  {
    question: "When can I expect to get approved as a seller?",
    answer:
      "Most seller applications are reviewed within 2 business days. Once approved, you can list products and connect to a warehouse immediately.",
  },
  {
    question: "Is there a weight or size limit on products?",
    answer:
      "Yes — each drone in our fleet carries up to 85kg per flight, and items must fit within the cargo bay envelope. We check this automatically when you add a product.",
  },
  {
    question: "How do payouts work?",
    answer:
      "Payouts are calculated per delivered order and released on a rolling schedule, visible in your seller dashboard alongside full earnings history.",
  },
  {
    question: "Can I store inventory in more than one warehouse?",
    answer:
      "Yes. Sellers can distribute stock across any partner warehouse, and orders automatically route from whichever location gets the item to the buyer fastest.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          The Most Common Questions About Selling on SmartLogix
        </h2>

        <div className="divide-y divide-slate-100 rounded-2xl bg-slate-50 px-6 ring-1 ring-slate-100">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.question} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-slate-800 sm:text-base">
                    {faq.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition ${
                      isOpen ? "bg-orange-500 rotate-45" : "bg-slate-900"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
