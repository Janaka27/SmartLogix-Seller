import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  role: "seller" | "admin" | "warehouse";
  children: ReactNode;
}

const ROLE_BADGE: Record<AuthShellProps["role"], { label: string; className: string }> = {
  seller: { label: "Seller", className: "bg-slate-800 text-white" },
  admin: { label: "Admin", className: "bg-orange-500 text-white" },
  warehouse: { label: "Warehouse", className: "bg-blue-600 text-white" },
};

export function AuthShell({ role, children }: AuthShellProps) {
  const badge = ROLE_BADGE[role];
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
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">{children}</div>
    </div>
  );
}
