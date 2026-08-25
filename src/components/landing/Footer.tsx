const columns = [
  {
    heading: "Platform",
    links: ["How It Works", "Become a Seller", "Warehouse Network", "Pricing"],
  },
  {
    heading: "Company",
    links: ["About Us", "Careers", "Blog", "Contact"],
  },
  {
    heading: "Support",
    links: ["Help Center", "Seller Guide", "Track an Order", "Status"],
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="w-full border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
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
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SmartLogix
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              A smarter marketplace for sellers, powered by an optimized
              drone delivery network.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-slate-900">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-500 transition hover:text-slate-900"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SmartLogix. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="#" className="transition hover:text-slate-700">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-slate-700">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
