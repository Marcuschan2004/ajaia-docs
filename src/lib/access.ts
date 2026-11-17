// Pure access-control rules. Kept free of I/O so they can be unit tested
// and reused by every API route.

export type ShareRole = "VIEWER" | "EDITOR";
export type Access = "owner" | "editor" | "viewer" | "none";

export interface DocAccessInput {
  ownerId: string;
  shares: { userId: string; role: ShareRole }[];
}

export function getAccess(doc: DocAccessInput, userId: string): Access {
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  if (!share) return "none";
  return share.role === "EDITOR" ? "editor" : "viewer";
}

export const canRead = (a: Access) => a !== "none";
export const canEdit = (a: Access) => a === "owner" || a === "editor";
// Only the owner can rename, delete, or change who has access.
export const canManage = (a: Access) => a === "owner";

export function validateShareTarget(ownerId: string, targetUserId: string): string | null {
  if (targetUserId === ownerId) return "You already own this document.";
  return null;
}
