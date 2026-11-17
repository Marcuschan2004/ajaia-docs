"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, timeAgo } from "@/lib/client";

type Owned = { id: string; title: string; updatedAt: string; shareCount: number };
type Shared = { id: string; title: string; updatedAt: string; role: "VIEWER" | "EDITOR"; owner: { name: string; email: string } };

const ACCEPT = ".txt,.md,.docx";

export default function Dashboard() {
  const router = useRouter();
  const [owned, setOwned] = useState<Owned[] | null>(null);
  const [shared, setShared] = useState<Shared[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ owned: Owned[]; shared: Shared[] }>("/api/documents");
      setOwned(data.owned);
      setShared(data.shared);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDoc() {
    setBusy(true);
    setError(null);
    try {
      const { id } = await api<{ id: string }>("/api/documents", { method: "POST", body: JSON.stringify({}) });
      router.push(`/docs/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const { id } = await api<{ id: string }>("/api/documents/import", { method: "POST", body: form });
      router.push(`/docs/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteDoc(id: string) {
    setError(null);
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      setPendingDelete(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="dashboard">
      <div className="actions">
        <button className="btn primary" onClick={createDoc} disabled={busy}>
          + New document
        </button>
        <label className={`btn ${busy ? "disabled" : ""}`}>
          Import file
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            hidden
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
          />
        </label>
        <span className="muted small">Import supports .txt, .md and .docx (max 5MB). It becomes a new editable doc.</span>
      </div>
      {error && <p className="error">{error}</p>}

      <section>
        <h2>My documents</h2>
        {owned === null ? (
          <p className="muted">Loading…</p>
        ) : owned.length === 0 ? (
          <p className="muted">No documents yet. Create one or import a file.</p>
        ) : (
          <ul className="doclist">
            {owned.map((d) => (
              <li key={d.id}>
                <Link href={`/docs/${d.id}`} className="doclink">
                  <span className="doctitle">{d.title}</span>
                  <span className="badge owner">Owner</span>
                  {d.shareCount > 0 && <span className="badge">Shared with {d.shareCount}</span>}
                  <span className="muted small">Edited {timeAgo(d.updatedAt)}</span>
                </Link>
                {pendingDelete === d.id ? (
                  <span className="confirm">
                    <button className="btn danger small" onClick={() => deleteDoc(d.id)}>
                      Confirm delete
                    </button>
                    <button className="btn ghost small" onClick={() => setPendingDelete(null)}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button className="btn ghost small" onClick={() => setPendingDelete(d.id)}>
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Shared with me</h2>
        {owned !== null && shared.length === 0 ? (
          <p className="muted">Nothing has been shared with you yet.</p>
        ) : (
          <ul className="doclist">
            {shared.map((d) => (
              <li key={d.id}>
                <Link href={`/docs/${d.id}`} className="doclink">
                  <span className="doctitle">{d.title}</span>
                  <span className={`badge ${d.role === "EDITOR" ? "editor" : "viewer"}`}>
                    {d.role === "EDITOR" ? "Can edit" : "View only"}
                  </span>
                  <span className="muted small">
                    from {d.owner.name} · Edited {timeAgo(d.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
