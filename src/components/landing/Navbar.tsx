"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-8">
        <Link href="#home" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 12.2 11 14.7l4.5-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            SmartLogix
          </span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/20 backdrop-blur lg:flex">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-white text-slate-900"
                  : "text-white/85 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:block">
          <a
            href="/seller/register"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-white/90"
          >
            Become a Seller
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-white lg:hidden"
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            {open ? (
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="mx-4 mb-4 rounded-2xl bg-slate-900/95 p-4 ring-1 ring-white/10 backdrop-blur lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/seller/register"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-900"
            >
              Become a Seller
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
