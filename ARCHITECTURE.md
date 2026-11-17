# Architecture Note

## Stack and why

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js 15 (App Router) + TypeScript | Frontend and API in one repo and one deploy. Less glue code in a 4 hour window. |
| Editor | TipTap 3 (ProseMirror) | Solid rich-text model with a schema, so pasted or imported HTML gets normalized instead of rendered raw. |
| Data | Postgres (Neon) via Prisma | Real relational data for owners and shares, and it survives serverless redeploys. SQLite on Vercel or Render free tiers would get wiped. |
| Import | mammoth (.docx), marked (.md) | Small, well-known converters to HTML. |
| Tests | Vitest | Fast, no DB needed. |
| Hosting | Vercel + Neon free tiers | Reviewers don't need to pay for anything. |

## Data model

```
User(id, name, email)
Document(id, title, content HTML, ownerId -> User, createdAt, updatedAt)
Share(documentId, userId, role VIEWER|EDITOR)   primary key (documentId, userId)
```

Ownership lives on the document and access lives in `Share`. One table answers "who can see this" and "what's shared with me" with an indexed lookup.

## Access control

All rules live in `src/lib/access.ts` as pure functions (`getAccess`, `canEdit`, `canManage`), and every API route goes through `loadDocForUser`.

| | Read | Edit content | Rename / delete / share |
| --- | --- | --- | --- |
| Owner | yes | yes | yes |
| Editor | yes | yes | no |
| Viewer | yes | no | no |
| No access | 404 | 404 | 404 |

Users without access get a 404 instead of a 403, so the API doesn't confirm a document exists. The UI hides controls the user can't use, but the server is the source of truth.

## What I prioritized

1. **The editing loop feeling solid.** Debounced autosave with a visible status (Saved / Saving / Unsaved / Save failed with Retry), Ctrl/Cmd+S, a keepalive save when leaving the page, and edits made during a save get queued instead of lost.
2. **Sharing that actually enforces something.** Roles are checked server side and covered by tests, not just hidden buttons.
3. **Import that's useful.** .docx keeps headings, bold, italics and lists through mammoth. Markdown raw HTML is escaped and plain text is escaped too.
4. **A test layer on the risky parts:** permissions and file conversion.

## Deliberate scope cuts

- **Mocked auth.** A seeded user picker with an httpOnly cookie. Real auth (OAuth or magic links) doesn't add much to what's being evaluated here and would eat an hour. The cookie holds a user id, so it's not secure, and that's fine for a demo.
- **No real-time co-editing.** Saves are last-write-wins. Proper concurrent editing needs CRDTs (Yjs plus a websocket server), which doesn't fit serverless hosting or the timebox.
- **Content stored as HTML** instead of ProseMirror JSON. It's easier to inspect, import and export, and TipTap re-parses it through its schema on load, so unsupported markup gets dropped.
- **Shares only go to existing users.** No invite-by-email for people who aren't signed up.

## What I'd build next with 2 to 4 more hours

1. Real auth (NextAuth with Google) in place of the user picker.
2. Version history: a `DocumentVersion` snapshot every N saves, with a restore button.
3. Optimistic concurrency: send `updatedAt` with each save and warn on conflicts instead of last-write-wins. After that, Yjs for live co-editing.
4. Playwright end-to-end tests for the share flow across two browser contexts.
5. Comments on text selections.
