import { marked } from "marked";

// Supported upload types. Keep this list in sync with the UI hint and README.
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type SupportedExt = (typeof SUPPORTED_EXTENSIONS)[number];

export function getExtension(filename: string): SupportedExt | null {
  const lower = filename.toLowerCase();
  const ext = SUPPORTED_EXTENSIONS.find((e) => lower.endsWith(e));
  return ext ?? null;
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return (base || "Imported document").slice(0, 120);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Plain text: blank lines split paragraphs, single newlines become <br>.
export function textToHtml(text: string): string {
  const paragraphs = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
}

export function markdownToHtml(md: string): string {
  // Raw HTML inside markdown is escaped rather than passed through.
  const html = marked.parse(md, {
    async: false,
    gfm: true,
    breaks: false,
    renderer: Object.assign(new marked.Renderer(), {
      html: ({ text }: { text: string }) => escapeHtml(text),
    }),
  }) as string;
  return html.trim() || "<p></p>";
}

export async function fileToHtml(filename: string, buffer: Buffer): Promise<string> {
  const ext = getExtension(filename);
  if (!ext) throw new Error(`Unsupported file type. Upload ${SUPPORTED_EXTENSIONS.join(", ")}.`);
  if (ext === ".txt") return textToHtml(buffer.toString("utf8"));
  if (ext === ".md") return markdownToHtml(buffer.toString("utf8"));
  const mammoth = await import("mammoth");
  const { value } = await mammoth.convertToHtml({ buffer });
  return value.trim() || "<p></p>";
}
