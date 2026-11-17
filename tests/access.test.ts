import { describe, expect, it } from "vitest";
import { canEdit, canManage, canRead, getAccess, validateShareTarget } from "@/lib/access";

const doc = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "EDITOR" as const },
    { userId: "carol", role: "VIEWER" as const },
  ],
};

describe("getAccess", () => {
  it("resolves owner, editor, viewer and outsider", () => {
    expect(getAccess(doc, "alice")).toBe("owner");
    expect(getAccess(doc, "bob")).toBe("editor");
    expect(getAccess(doc, "carol")).toBe("viewer");
    expect(getAccess(doc, "mallory")).toBe("none");
  });

  it("maps access levels to permissions", () => {
    expect([canRead("owner"), canEdit("owner"), canManage("owner")]).toEqual([true, true, true]);
    expect([canRead("editor"), canEdit("editor"), canManage("editor")]).toEqual([true, true, false]);
    expect([canRead("viewer"), canEdit("viewer"), canManage("viewer")]).toEqual([true, false, false]);
    expect([canRead("none"), canEdit("none"), canManage("none")]).toEqual([false, false, false]);
  });

  it("refuses sharing a document with its owner", () => {
    expect(validateShareTarget("alice", "alice")).toMatch(/already own/);
    expect(validateShareTarget("alice", "bob")).toBeNull();
  });
});
