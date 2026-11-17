import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { loadDocForUser, requireUser } from "@/lib/docs";
import { canEdit, canManage } from "@/lib/access";
import { updateDocSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const { doc, access } = await loadDocForUser(id, user.id);
  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    updatedAt: doc.updatedAt,
    owner: doc.owner,
    access,
    shares: access === "owner" ? doc.shares.map((s) => ({ user: s.user, role: s.role })) : [],
  });
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const { access } = await loadDocForUser(id, user.id);
  const body = updateDocSchema.parse(await req.json());
  if (!canEdit(access)) throw new HttpError(403, "You have view-only access to this document.");
  if (body.title !== undefined && !canManage(access)) throw new HttpError(403, "Only the owner can rename this document.");
  const updated = await prisma.document.update({
    where: { id },
    data: body,
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json(updated);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const { access } = await loadDocForUser(id, user.id);
  if (!canManage(access)) throw new HttpError(403, "Only the owner can delete this document.");
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
