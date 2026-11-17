"use client";

import { useState } from "react";
import { api } from "@/lib/client";

export type ShareEntry = { user: { id: string; name: string; email: string }; role: "VIEWER" | "EDITOR" };

export default function SharePanel({
  docId,
  shares,
  onChange,
  onClose,
}: {
  docId: string;
  shares: ShareEntry[];
  onChange: (s: ShareEntry[]) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const entry = await api<ShareEntry>(`/api/documents/${docId}/shares`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      onChange([...shares.filter((s) => s.user.id !== entry.user.id), entry]);
      setEmail("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    setError(null);
    try {
      await api(`/api/documents/${docId}/shares`, { method: "DELETE", body: JSON.stringify({ userId }) });
      onChange(shares.filter((s) => s.user.id !== userId));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <aside className="sharepanel">
      <div className="sharehead">
        <h3>Share document</h3>
        <button className="btn ghost small" onClick={onClose} aria-label="Close sharing panel">
          ✕
        </button>
      </div>
      <form onSubmit={add} className="shareform">
        <input
          type="email"
          placeholder="name@ajaia.test"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email to share with"
        />
        <select value={role} onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")} aria-label="Access level">
          <option value="EDITOR">Can edit</option>
          <option value="VIEWER">View only</option>
        </select>
        <button className="btn primary" disabled={busy || !email}>
          Share
        </button>
      </form>
      <p className="muted small">Demo users: alice@ajaia.test, bob@ajaia.test, carol@ajaia.test</p>
      {error && <p className="error">{error}</p>}
      <h4>People with access</h4>
      {shares.length === 0 ? (
        <p className="muted small">Only you can see this document.</p>
      ) : (
        <ul className="sharelist">
          {shares.map((s) => (
            <li key={s.user.id}>
              <span>
                <strong>{s.user.name}</strong>
                <small>{s.user.email}</small>
              </span>
              <span className={`badge ${s.role === "EDITOR" ? "editor" : "viewer"}`}>
                {s.role === "EDITOR" ? "Can edit" : "View only"}
              </span>
              <button className="btn ghost small" onClick={() => remove(s.user.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
