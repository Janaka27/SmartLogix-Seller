import { AuthShell } from "@/components/auth/AuthShell";

export default function WarehouseAuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell role="warehouse">{children}</AuthShell>;
}
