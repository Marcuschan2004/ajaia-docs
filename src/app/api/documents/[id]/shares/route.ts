import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { loadDocForUser, requireUser } from "@/lib/docs";
import { canManage, validateShareTarget } from "@/lib/access";
import { shareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function requireOwner(id: string) {
  const user = await requireUser();
  const { doc, access } = await loadDocForUser(id, user.id);
  if (!canManage(access)) throw new HttpError(403, "Only the owner can manage sharing.");
  return doc;
}

// Grant or update access by email.
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const doc = await requireOwner(id);
  const { email, role } = shareSchema.parse(await req.json());
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) throw new HttpError(404, `No user with email ${email}.`);
  const problem = validateShareTarget(doc.ownerId, target.id);
  if (problem) throw new HttpError(400, problem);
  await prisma.share.upsert({
    where: { documentId_userId: { documentId: id, userId: target.id } },
    update: { role },
    create: { documentId: id, userId: target.id, role },
  });
  return NextResponse.json({ user: { id: target.id, name: target.name, email: target.email }, role }, { status: 201 });
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  await requireOwner(id);
  const { userId } = z.object({ userId: z.string().min(1) }).parse(await req.json());
  await prisma.share.deleteMany({ where: { documentId: id, userId } });
  return NextResponse.json({ ok: true });
});
