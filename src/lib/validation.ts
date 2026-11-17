import { z } from "zod";

export const MAX_TITLE = 120;
export const MAX_CONTENT_BYTES = 1_000_000; // ~1MB of HTML per document

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty.")
  .max(MAX_TITLE, `Title must be ${MAX_TITLE} characters or fewer.`);

export const createDocSchema = z.object({ title: titleSchema.optional() });

export const updateDocSchema = z
  .object({
    title: titleSchema.optional(),
    content: z
      .string()
      .refine((c) => Buffer.byteLength(c, "utf8") <= MAX_CONTENT_BYTES, "Document is too large (1MB max).")
      .optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, "Nothing to update.");

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  role: z.enum(["VIEWER", "EDITOR"]).default("EDITOR"),
});
