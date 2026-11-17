import { cookies } from "next/headers";
import { prisma } from "./db";

// Mocked auth: the reviewer picks a seeded user on /login and we store the id
// in an httpOnly cookie. Intentionally not real authentication (see README).
export const SESSION_COOKIE = "ajaia_uid";

export async function getCurrentUser() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
