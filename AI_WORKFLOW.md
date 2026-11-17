# AI Workflow Note

## Tools used

- **Claude (Opus, agent mode)** as the main pair programmer: scoping, scaffolding, writing code and tests, and driving my Chrome to click through the app.
- **Vitest and the TypeScript compiler** as the checks on what the AI wrote.

## How I split the work

I made the product calls first (stack, scope cuts, roles, which file types to support) and had Claude build in layers: schema and pure permission logic, then API routes, then UI, then tests and docs. Each layer got checked before moving on, so mistakes didn't pile up.

## Where AI sped things up

- Scaffolding the Next.js app, Prisma schema, and REST routes in about 20 minutes instead of an hour plus.
- Boilerplate-heavy UI (toolbar, share panel, dashboard lists) and the CSS.
- Writing test cases, including a route test that mocks Prisma and the session so the real permission flow runs without a database.
- Drafting the README and these notes, which I then edited.

## What I changed or rejected

- **Heading picker:** the first toolbar used a native dropdown for text styles. On Mac Chrome it held focus after picking an option, so headings got stuck and spread to other lines. I replaced it with Normal / H1 / H2 / H3 buttons that never take focus from the editor.
- **Line breaks:** while recording I noticed Enter sometimes made a soft line break inside the same paragraph, so H1 or List would apply to the whole block. I turned off soft breaks and mapped every new-line input to a new paragraph or list item.
- **Delete confirmation:** the first version used the browser's `confirm()` popup. I swapped it for an inline "Confirm delete" button since it's a smoother UX and doesn't block automated testing.
- **403 vs 404:** I had the API return 404 to users without access so it doesn't reveal which document ids exist. Users with access but the wrong role still get a clear 403.
- **Prop mutation:** the generated title-rename code mutated a React prop to track the saved title. I changed it to a ref.
- **Links:** TipTap 3's StarterKit enables links by default. I turned that off because it wasn't in scope and it's one less place for unsafe URLs from imported files.
- **Dependency conflict:** the latest Vitest version caused an npm peer-dependency crash, so I pinned Vitest 3 instead of forcing the install.
- **Raw HTML in Markdown imports:** I made sure it gets escaped instead of passed through, and added a test for it.

## How I verified it

- **Tests:** 13 Vitest tests covering the permission matrix, file conversion (including XSS-style input), and the PATCH route returning 401 / 403 / 404 / 400 for the right users.
- **Type checking:** `tsc --noEmit` stays clean.
- **Manual end-to-end pass in the browser** as all three seeded users: create, format, reload to confirm persistence, rename, import .txt / .md / .docx, share as editor and viewer, confirm the viewer is read-only and can't rename, revoke access, and export Markdown.
- **The same pass again on the live Vercel deployment** before submitting.
