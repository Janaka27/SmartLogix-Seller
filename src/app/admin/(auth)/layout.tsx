import { AuthShell } from "@/components/auth/AuthShell";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell role="admin">{children}</AuthShell>;
}
