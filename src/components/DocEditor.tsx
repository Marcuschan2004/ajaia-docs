"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import TurndownService from "turndown";
import { api } from "@/lib/client";
import Toolbar from "./Toolbar";
import SharePanel, { type ShareEntry } from "./SharePanel";

type Access = "owner" | "editor" | "viewer";
type Doc = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string };
  access: Access;
  shares: ShareEntry[];
};
type SaveState = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_MS = 800;

// Every way of starting a new line (Enter, Shift+Enter, Cmd+Enter, or an
// input method sending "insertLineBreak") makes a new paragraph or list item.
// Soft line breaks inside one block made headings and list toggles swallow
// several lines at once, which felt broken.
const NewLineAsBlock = Extension.create({
  name: "newLineAsBlock",
  priority: 1000,
  addKeyboardShortcuts() {
    const split = () =>
      this.editor.commands.first(({ commands }) => [() => commands.splitListItem("listItem"), () => commands.splitBlock()]);
    return { "Shift-Enter": split, "Mod-Enter": split };
  },
});

export default function DocEditor({ id }: { id: string }) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api<Doc>(`/api/documents/${id}`)
      .then(setDoc)
      .catch((e) => setLoadError((e as Error).message));
  }, [id]);

  if (loadError)
    return (
      <div className="center">
        <p className="error">{loadError}</p>
        <Link href="/" className="btn">
          Back to documents
        </Link>
      </div>
    );
  if (!doc) return <p className="center muted">Loading document…</p>;
  return <LoadedEditor initial={doc} />;
}

function LoadedEditor({ initial }: { initial: Doc }) {
  const canEdit = initial.access !== "viewer";
  const isOwner = initial.access === "owner";

  const [title, setTitle] = useState(initial.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const savedTitle = useRef(initial.title);
  const [shares, setShares] = useState(initial.shares);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);

  const latestHtml = useRef(initial.content);
  const savedHtml = useRef(initial.content);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (inFlight.current || latestHtml.current === savedHtml.current) return;
    inFlight.current = true;
    const html = latestHtml.current;
    setSaveState("saving");
    try {
      await api(`/api/documents/${initial.id}`, { method: "PATCH", body: JSON.stringify({ content: html }) });
      savedHtml.current = html;
      setSaveError(null);
      setSaveState(latestHtml.current === html ? "saved" : "dirty");
    } catch (e) {
      setSaveError((e as Error).message);
      setSaveState("error");
    } finally {
      inFlight.current = false;
      // Edits that arrived while saving get their own save.
      if (latestHtml.current !== savedHtml.current) timer.current = setTimeout(flush, AUTOSAVE_MS);
    }
  }, [initial.id]);

  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false, hardBreak: false }), NewLineAsBlock],
    content: initial.content,
    editable: canEdit,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "prose", "aria-label": "Document body" },
      handleDOMEvents: {
        beforeinput: (view, event) => {
          if ((event as InputEvent).inputType !== "insertLineBreak") return false;
          event.preventDefault();
          editorRef.current?.commands.first(({ commands }) => [
            () => commands.splitListItem("listItem"),
            () => commands.splitBlock(),
          ]);
          return true;
        },
      },
    },
    onUpdate: ({ editor: e }) => {
      latestHtml.current = e.getHTML();
      setSaveState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
  });

  editorRef.current = editor;

  // Save on Ctrl/Cmd+S, warn before leaving with unsaved changes, and
  // fire a last keepalive save when navigating away inside the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush();
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (latestHtml.current !== savedHtml.current) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
      if (latestHtml.current !== savedHtml.current) {
        fetch(`/api/documents/${initial.id}`, {
          method: "PATCH",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: latestHtml.current }),
        });
      }
    };
  }, [flush, initial.id]);

  async function saveTitle() {
    const next = title.trim();
    if (next === savedTitle.current) return setTitle(next);
    setTitleError(null);
    try {
      await api(`/api/documents/${initial.id}`, { method: "PATCH", body: JSON.stringify({ title: next }) });
      savedTitle.current = next;
      setTitle(next);
    } catch (e) {
      setTitleError((e as Error).message);
      setTitle(savedTitle.current);
    }
  }

  function exportMarkdown() {
    if (!editor) return;
    const md = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" }).turndown(editor.getHTML());
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^\w\- ]+/g, "").trim() || "document"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const statusText = {
    saved: "All changes saved",
    dirty: "Unsaved changes…",
    saving: "Saving…",
    error: `Save failed: ${saveError ?? ""}`,
  }[saveState];

  return (
    <div className="docpage">
      <div className="dochead">
        <Link href="/" className="btn ghost small" aria-label="Back to documents">
          ← Docs
        </Link>
        <div className="titlewrap">
          <input
            className="titleinput"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            disabled={!isOwner}
            maxLength={120}
            aria-label="Document title"
            title={isOwner ? "Rename document" : "Only the owner can rename"}
          />
          <span className="muted small">
            {isOwner ? "You own this document" : `Owned by ${initial.owner.name}`} ·{" "}
            <span className={`savestatus ${saveState}`}>{canEdit ? statusText : "View only"}</span>
            {saveState === "error" && (
              <button className="linkbtn" onClick={flush}>
                Retry
              </button>
            )}
          </span>
          {titleError && <span className="error small">{titleError}</span>}
        </div>
        <div className="headactions">
          <button className="btn ghost" onClick={exportMarkdown}>
            Export .md
          </button>
          {isOwner && (
            <button className="btn primary" onClick={() => setShareOpen((o) => !o)}>
              Share{shares.length > 0 ? ` (${shares.length})` : ""}
            </button>
          )}
        </div>
      </div>

      {!canEdit && <div className="banner">You have view-only access. Ask {initial.owner.name} for edit access.</div>}
      {canEdit && editor && <Toolbar editor={editor} />}

      <div className="docbody">
        <div className="paper">
          <EditorContent editor={editor} />
        </div>
        {shareOpen && isOwner && (
          <SharePanel docId={initial.id} shares={shares} onChange={setShares} onClose={() => setShareOpen(false)} />
        )}
      </div>
    </div>
  );
}
