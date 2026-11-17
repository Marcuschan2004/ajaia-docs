import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/http";

// Public list of the seeded demo users (used by the login picker).
export const GET = handle(async () => {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } });
  return NextResponse.json({ users });
});
