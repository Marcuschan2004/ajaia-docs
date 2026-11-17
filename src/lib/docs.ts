import { prisma } from "./db";
import { getAccess, type Access } from "./access";
import { HttpError } from "./http";
import { getCurrentUser } from "./session";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please sign in.");
  return user;
}

// Loads a document and the caller's access level. 404 (not 403) when the
// caller has no access, so document ids are not confirmed to outsiders.
export async function loadDocForUser(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!doc) throw new HttpError(404, "Document not found.");
  const access: Access = getAccess(doc, userId);
  if (access === "none") throw new HttpError(404, "Document not found.");
  return { doc, access };
}
