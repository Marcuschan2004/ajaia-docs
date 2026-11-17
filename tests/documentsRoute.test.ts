import { beforeEach, describe, expect, it, vi } from "vitest";

// Integration-style test of the PATCH /api/documents/:id handler with the
// database and session mocked, so the real permission flow is exercised.
const state = vi.hoisted(() => ({ currentUser: "carol" as string | null, updates: [] as unknown[] }));

vi.mock("@/lib/session", () => ({
  getCurrentUser: async () => (state.currentUser ? { id: state.currentUser, name: state.currentUser, email: "x" } : null),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    document: {
      findUnique: async () => ({
        id: "d1",
        title: "Plan",
        content: "<p>hi</p>",
        ownerId: "alice",
        owner: { id: "alice", name: "Alice", email: "alice@ajaia.test" },
        shares: [
          { userId: "bob", role: "EDITOR", user: { id: "bob" } },
          { userId: "carol", role: "VIEWER", user: { id: "carol" } },
        ],
      }),
      update: async (args: unknown) => {
        state.updates.push(args);
        return { id: "d1", title: "Plan", updatedAt: new Date() };
      },
    },
  },
}));

import { PATCH } from "@/app/api/documents/[id]/route";

const patch = (body: unknown) =>
  PATCH(new Request("http://test/api/documents/d1", { method: "PATCH", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id: "d1" }),
  });

describe("PATCH /api/documents/:id", () => {
  beforeEach(() => {
    state.updates = [];
  });

  it("blocks a viewer from editing content", async () => {
    state.currentUser = "carol";
    const res = await patch({ content: "<p>hacked</p>" });
    expect(res.status).toBe(403);
    expect(state.updates).toHaveLength(0);
  });

  it("lets an editor save content but not rename", async () => {
    state.currentUser = "bob";
    expect((await patch({ content: "<p>edit</p>" })).status).toBe(200);
    expect((await patch({ title: "New name" })).status).toBe(403);
    expect(state.updates).toHaveLength(1);
  });

  it("hides the document from users without access", async () => {
    state.currentUser = "mallory";
    expect((await patch({ content: "<p>x</p>" })).status).toBe(404);
  });

  it("requires sign-in", async () => {
    state.currentUser = null;
    expect((await patch({ content: "<p>x</p>" })).status).toBe(401);
  });

  it("validates input", async () => {
    state.currentUser = "alice";
    const res = await patch({ title: "   " });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/empty/);
  });
});
