import Image from "next/image";

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
            <div className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="SmartLogix"
                width={911}
                height={285}
                className="h-8 w-auto"
              />
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
