import Image from "next/image";
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
        <Image
          src="/images/logo-white-text.png"
          alt="SmartLogix"
          width={911}
          height={285}
          priority
          className="h-9 w-auto"
        />
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
