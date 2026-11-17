import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import DocEditor from "@/components/DocEditor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) redirect("/login");
  const { id } = await params;
  return <DocEditor id={id} />;
}
