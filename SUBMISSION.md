# Submission: Ajaia AI-Native Full Stack Developer Assignment

**Candidate:** Marcus Chan (mchan.marcus@gmail.com)

## Links

- **Live app:** LIVE_URL_HERE
- **Source code:** https://github.com/Marcuschan2004/ajaia-docs (the same code is in this Drive folder)
- **Walkthrough video:** VIDEO_URL_HERE (also in `VIDEO_URL.txt`)

## Test accounts

No passwords. Pick a user on the sign-in page.

| User | Email | Role on the seeded "Welcome to Ajaia Docs" doc |
| --- | --- | --- |
| Alice Owner | alice@ajaia.test | Owner |
| Bob Editor | bob@ajaia.test | Can edit |
| Carol Viewer | carol@ajaia.test | View only |

**Fastest way to review sharing:** sign in as Alice in a normal window and as Carol or Bob in an incognito window. Share a doc from Alice and refresh the other window.

## What's included

| File | What it is |
| --- | --- |
| `ajaia-docs/` | Full source code (Next.js + TypeScript + Prisma) |
| `README.md` | Features, local setup and run instructions, deploy steps |
| `ARCHITECTURE.md` | Architecture note: stack, data model, access rules, priorities, scope cuts, next steps |
| `AI_WORKFLOW.md` | AI workflow note: tools, where AI helped, what I changed or rejected, how I verified |
| `SUBMISSION.md` | This file |
| `VIDEO_URL.txt` | Walkthrough video link |
| `samples/` | Sample .txt, .md and .docx files for testing import |
| `tests/` | 13 Vitest tests (run with `npm test`) |

## What's working

- Create, rename, delete, edit, save (autosave) and reopen documents
- Rich text: bold, italic, underline, headings 1 to 3, bulleted and numbered lists, undo/redo
- Import .txt, .md and .docx into a new editable document (5MB max, other types rejected)
- Sharing by email with Can edit or View only, changing roles and removing access, enforced on the server
- Owned vs shared documents shown separately on the dashboard, with role badges
- Postgres persistence (Neon), so docs, formatting and shares survive refreshes and redeploys
- Export to Markdown (stretch item)

## What's incomplete or intentionally left out

- Real authentication (mocked with seeded users on purpose)
- Real-time co-editing; saves are last-write-wins
- Comments and version history

## What I'd build next with another 2 to 4 hours

1. Real auth with Google sign-in
2. Version history with restore
3. Conflict detection on save, then Yjs for live co-editing
4. Playwright end-to-end tests for the sharing flow
