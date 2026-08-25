import { AuthShell } from "@/components/auth/AuthShell";

export default function SellerAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell role="seller">{children}</AuthShell>;
}
