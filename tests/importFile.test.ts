import { describe, expect, it } from "vitest";
import { fileToHtml, getExtension, markdownToHtml, textToHtml, titleFromFilename } from "@/lib/importFile";

describe("file import", () => {
  it("accepts only supported extensions (case-insensitive)", () => {
    expect(getExtension("notes.TXT")).toBe(".txt");
    expect(getExtension("readme.md")).toBe(".md");
    expect(getExtension("report.docx")).toBe(".docx");
    expect(getExtension("image.png")).toBeNull();
    expect(getExtension("old.doc")).toBeNull();
  });

  it("derives a title from the filename", () => {
    expect(titleFromFilename("Q3 plan.md")).toBe("Q3 plan");
    expect(titleFromFilename(".md")).toBe("Imported document");
  });

  it("turns plain text into escaped paragraphs", () => {
    expect(textToHtml("Hello\nworld\n\n<script>x</script>")).toBe(
      "<p>Hello<br>world</p><p>&lt;script&gt;x&lt;/script&gt;</p>",
    );
    expect(textToHtml("   ")).toBe("<p></p>");
  });

  it("converts markdown formatting and escapes raw HTML", () => {
    const html = markdownToHtml("# Title\n\n**bold** and *italic*\n\n- one\n- two\n\n<img src=x onerror=alert(1)>");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<li>one</li>");
    expect(html).not.toContain("<img");
  });

  it("rejects unsupported files", async () => {
    await expect(fileToHtml("evil.exe", Buffer.from("x"))).rejects.toThrow(/Unsupported/);
  });
});
