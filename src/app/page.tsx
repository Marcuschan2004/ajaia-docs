import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await getCurrentUser())) redirect("/login");
  return <Dashboard />;
}
