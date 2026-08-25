import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  role: "seller" | "admin";
  children: ReactNode;
}

export function AuthShell({ role, children }: AuthShellProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/20">
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
        <span className="text-lg font-bold tracking-tight text-white">SmartLogix</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            role === "seller" ? "bg-slate-800 text-white" : "bg-orange-500 text-white"
          }`}
        >
          {role === "seller" ? "Seller" : "Admin"}
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">{children}</div>
    </div>
  );
}
