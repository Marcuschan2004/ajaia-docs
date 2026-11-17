import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { SESSION_COOKIE, getCurrentUser } from "@/lib/session";

export const GET = handle(async () => {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
});

export const POST = handle(async (req: Request) => {
  const { userId } = z.object({ userId: z.string().min(1) }).parse(await req.json());
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Unknown user.");
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
});

export const DELETE = handle(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
