import { redirect } from "next/navigation";
import { DashboardHome } from "@/features/dashboard/DashboardHome";
import { getSession } from "@/lib/session";

// Página delgada: obtiene lo que necesita y renderiza la feature.
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <DashboardHome user={session.user} />;
}
