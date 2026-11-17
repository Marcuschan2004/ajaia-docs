"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";

export default function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const blockValue = s.h1 ? "h1" : s.h2 ? "h2" : s.h3 ? "h3" : "p";
  const chain = () => editor.chain().focus();

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <button title="Undo (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!s.canUndo}>
        ↶
      </button>
      <button title="Redo (Ctrl+Shift+Z)" onClick={() => chain().redo().run()} disabled={!s.canRedo}>
        ↷
      </button>
      <span className="sep" />
      <select
        aria-label="Text style"
        value={blockValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") chain().setParagraph().run();
          else chain().setHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
        }}
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <span className="sep" />
      <button title="Bold (Ctrl+B)" className={s.bold ? "on" : ""} onClick={() => chain().toggleBold().run()}>
        <b>B</b>
      </button>
      <button title="Italic (Ctrl+I)" className={s.italic ? "on" : ""} onClick={() => chain().toggleItalic().run()}>
        <i>I</i>
      </button>
      <button title="Underline (Ctrl+U)" className={s.underline ? "on" : ""} onClick={() => chain().toggleUnderline().run()}>
        <u>U</u>
      </button>
      <span className="sep" />
      <button title="Bulleted list" className={s.bullet ? "on" : ""} onClick={() => chain().toggleBulletList().run()}>
        • List
      </button>
      <button title="Numbered list" className={s.ordered ? "on" : ""} onClick={() => chain().toggleOrderedList().run()}>
        1. List
      </button>
    </div>
  );
}
