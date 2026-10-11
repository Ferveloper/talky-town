import { requireAdult } from "@/lib/server/auth";
import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const adult = await requireAdult();
  return <AppShell adult={adult}>{children}</AppShell>;
}
