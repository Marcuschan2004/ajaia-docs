import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const SEED_USERS = [
  { id: "u_alice", name: "Alice Owner", email: "alice@ajaia.test" },
  { id: "u_bob", name: "Bob Editor", email: "bob@ajaia.test" },
  { id: "u_carol", name: "Carol Viewer", email: "carol@ajaia.test" },
];

async function main() {
  for (const u of SEED_USERS) {
    await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
  }

  const existing = await prisma.document.findFirst({ where: { ownerId: "u_alice", title: "Welcome to Ajaia Docs" } });
  if (!existing) {
    await prisma.document.create({
      data: {
        title: "Welcome to Ajaia Docs",
        ownerId: "u_alice",
        content:
          "<h1>Welcome to Ajaia Docs</h1><p>This document is owned by <strong>Alice</strong> and shared with <em>Bob</em> (editor) and <u>Carol</u> (viewer).</p><ul><li><p>Try bold, italic, underline</p></li><li><p>Headings and lists</p></li></ul>",
        shares: {
          create: [
            { userId: "u_bob", role: "EDITOR" },
            { userId: "u_carol", role: "VIEWER" },
          ],
        },
      },
    });
  }
  console.log("Seeded users:", SEED_USERS.map((u) => u.email).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
