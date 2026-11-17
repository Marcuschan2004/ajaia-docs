import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/http";
import { requireUser } from "@/lib/docs";
import { createDocSchema } from "@/lib/validation";

export const GET = handle(async () => {
  const user = await requireUser();
  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, _count: { select: { shares: true } } },
    }),
    prisma.share.findMany({
      where: { userId: user.id },
      orderBy: { document: { updatedAt: "desc" } },
      select: {
        role: true,
        document: { select: { id: true, title: true, updatedAt: true, owner: { select: { name: true, email: true } } } },
      },
    }),
  ]);
  return NextResponse.json({
    owned: owned.map((d) => ({ id: d.id, title: d.title, updatedAt: d.updatedAt, shareCount: d._count.shares })),
    shared: shared.map((s) => ({ ...s.document, role: s.role })),
  });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = createDocSchema.parse(await req.json().catch(() => ({})));
  const doc = await prisma.document.create({
    data: { title: body.title ?? "Untitled document", ownerId: user.id },
    select: { id: true },
  });
  return NextResponse.json(doc, { status: 201 });
});
