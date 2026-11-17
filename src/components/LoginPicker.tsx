"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

type U = { id: string; name: string; email: string };

export default function LoginPicker({ users }: { users: U[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function pick(id: string) {
    setBusy(id);
    setError(null);
    try {
      await api("/api/session", { method: "POST", body: JSON.stringify({ userId: id }) });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  if (users.length === 0) return <p className="error">No users found. Run the seed script (see README).</p>;
  return (
    <div className="userlist">
      {users.map((u) => (
        <button key={u.id} className="usercard" disabled={!!busy} onClick={() => pick(u.id)}>
          <span className="avatar lg">{u.name[0]}</span>
          <span>
            <strong>{u.name}</strong>
            <small>{u.email}</small>
          </span>
          {busy === u.id && <span className="muted">Signing in…</span>}
        </button>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
