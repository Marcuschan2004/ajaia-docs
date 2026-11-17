# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs. Users can create, rename, edit, and reopen rich-text documents, import files into new documents, and share documents with other users as editors or viewers.

**Live app:** https://ajaia-docs-mu-tan.vercel.app

## Demo accounts

Auth is mocked on purpose (see ARCHITECTURE.md). On the sign-in page, pick one of the seeded users:

| User | Email | In the seeded "Welcome" doc |
| --- | --- | --- |
| Alice Owner | alice@ajaia.test | Owner |
| Bob Editor | bob@ajaia.test | Can edit |
| Carol Viewer | carol@ajaia.test | View only |

To test sharing, open the app as Alice in one window and as Bob or Carol in an incognito window (each browser keeps its own session cookie). Use **Switch user** in the top right to change accounts.

## Features

- **Documents:** create, rename (owner only), delete (owner only), and edit in the browser. Autosave about a second after you stop typing, plus Ctrl/Cmd+S. Save status shows in the header.
- **Rich text:** bold, italic, underline, Heading 1 to 3, bulleted and numbered lists, undo/redo. Formatting is stored as HTML and survives reloads.
- **File import:** upload a **.txt, .md, or .docx** file (5MB max) from the dashboard and it becomes a new editable document. Other types are rejected with a clear message.
- **Sharing:** the owner shares by email with **Can edit** or **View only** access, changes roles, and removes access. The dashboard splits **My documents** and **Shared with me**, with role badges. Viewers get a read-only editor and the API also enforces it.
- **Export:** download any document as Markdown.

## Run locally

Requires Node 20+ and a Postgres database (a free [Neon](https://neon.tech) database works).

```bash
git clone https://github.com/Marcuschan2004/ajaia-docs.git
cd ajaia-docs
cp .env.example .env        # then set DATABASE_URL to your Postgres connection string
npm install
npx prisma db push          # creates the tables
npm run db:seed             # creates the 3 demo users and a shared welcome doc
npm run dev                 # http://localhost:3000
```

Run the tests (no database needed):

```bash
npm test
```

## Deploy (Vercel + Neon, both free)

1. Push the repo to GitHub and import it in Vercel.
2. Add the `DATABASE_URL` environment variable (Neon connection string).
3. Deploy. The build runs `prisma generate && next build`.
4. Run `npx prisma db push` and `npm run db:seed` once against the same database (from your machine with the same `DATABASE_URL`).

## Project structure

```
prisma/schema.prisma          User, Document, Share (role: VIEWER | EDITOR)
prisma/seed.ts                Demo users + shared welcome doc
src/lib/access.ts             Pure permission rules (owner / editor / viewer / none)
src/lib/importFile.ts         .txt / .md / .docx to HTML conversion
src/lib/validation.ts         Zod schemas for request bodies
src/app/api/...               REST routes: session, documents, import, shares
src/components/DocEditor.tsx  TipTap editor, autosave, rename, export
src/components/SharePanel.tsx Share by email, roles, remove access
tests/                        Vitest: access rules, import conversion, API permission checks
```

## Status

**Working end to end:** everything listed under Features, on the live deployment.

**Not built (on purpose):** real authentication, real-time co-editing, comments, version history. See ARCHITECTURE.md for the reasoning and what I'd build next.
