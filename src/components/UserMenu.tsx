"use client";

import { useRouter } from "next/navigation";

export default function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }
  return (
    <div className="usermenu">
      <span className="avatar">{name[0]}</span>
      <span className="who">
        <strong>{name}</strong>
        <small>{email}</small>
      </span>
      <button className="btn ghost" onClick={signOut}>
        Switch user
      </button>
    </div>
  );
}
