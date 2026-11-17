import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ajaia Docs",
  description: "A lightweight collaborative document editor",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            <span className="logo">A</span> Ajaia Docs
          </Link>
          {user && <UserMenu name={user.name} email={user.email} />}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
