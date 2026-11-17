import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireUser } from "@/lib/docs";
import { fileToHtml, getExtension, MAX_UPLOAD_BYTES, SUPPORTED_EXTENSIONS, titleFromFilename } from "@/lib/importFile";

export const runtime = "nodejs";

// Upload a .txt / .md / .docx file and turn it into a new editable document.
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a file to upload.");
  if (!getExtension(file.name)) {
    throw new HttpError(415, `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}.`);
  }
  if (file.size === 0) throw new HttpError(400, "That file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "File is too large (5MB max).");

  let content: string;
  try {
    content = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new HttpError(422, "Could not read that file. Is it a valid document?");
  }

  const doc = await prisma.document.create({
    data: { title: titleFromFilename(file.name), content, ownerId: user.id },
    select: { id: true },
  });
  return NextResponse.json(doc, { status: 201 });
});
