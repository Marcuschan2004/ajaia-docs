import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import LoginPicker from "@/components/LoginPicker";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const users = await prisma.user.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, email: true } });
  return (
    <div className="login">
      <h1>Sign in</h1>
      <p className="muted">
        Demo mode: pick a seeded account. Open a second browser (or incognito window) as another user to test sharing.
      </p>
      <LoginPicker users={users} />
    </div>
  );
}
