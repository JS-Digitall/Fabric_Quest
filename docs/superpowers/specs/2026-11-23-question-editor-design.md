# In-app question editor — design

Date: 2026-11-23 · Status: draft for approval

## Intent

Fabric Quest was published as open source. The feedback: people want to fork
it and adapt the questions to their own team. Today every question lives in
TypeScript files under `packages/frontend/src/game/content/`, so adapting it
means editing code and redeploying.

We are moving the question content into the app's own Fabric database and
adding an in-app editor. Two reasons, both from the owner:

1. Team leads in a fork can change the questions without touching code.
2. It shows off what Fabric Apps can do: saved records, Fabric sign-in, and
   server-enforced permissions in a real app.

## Goals

- Editors can change each chapter's title and tagline, edit its two story
  scenes, and create, edit, reorder and delete its questions (all four kinds).
- *Builder's call, from the review:* the world map shows only the **first**
  story scene to the chapter's NPC before the chapter is cleared and the
  **last** one after (`rpg/ui/WorldView.tsx`). So stories are two fixed slots,
  **Intro** (always first) and **Outro** (always last). They can be edited
  (speaker, lines, art chosen from the existing art list) but not added,
  deleted or moved. The validator requires exactly one of each, in those
  positions, and questions are reordered only between them.
- Only editors listed by email can write. The server enforces this, not the UI.
- A fresh fork plays immediately with no setup beyond deploying.
- An editor can't save content that breaks the game.

## Non-goals

- Adding or removing chapters. The six chapters are bound to six map regions
  (palettes, NPCs, bosses in `rpg/`). Chapter ids stay fixed.
- Editing art, the map, scoring or the difficulty rules.
- Managing editors inside the app, drafts, version history, or multi-language content.
- Importing or exporting content files.

## Anti-goals (would be a failure even if it works)

- Any signed-in player can change content.
- A broken or unreachable database silently swaps in the starter questions,
  hiding a misconfigured deployment.
- Forking gets harder: extra required setup steps before the game plays.
- Weakening the protected-assets/auth setup or the server-side permissions.

## Constraints

- Rayfin data (Data API Builder on MSSQL). Every `@text` needs `max`. MSSQL
  non-MAX `NVARCHAR` is at most 4000. The largest current scene serializes to
  about 980 characters, and there are 61 scenes in total.
- Policies can compare only `claims.sub`, `claims.email` and `claims.role` with
  `eq`/`neq`, combined with `and`/`or` (`rayfin-core/dist/policy.d.ts`).
  Fabric workspace roles aren't available as claims.
- Seed scripts only work locally (email/password auth), so a deployed fork
  can't be auto-seeded. Seeding has to happen from inside the app.
- Collection queries page at 100 by default. Read with explicit paging or `first(n)`.
- Keep `assetAccess: protected`, `AuthGate`, and password auth disabled.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| A | Content as plain JSON/YAML files in the repo, validated at build | Smallest and fork-friendly, but needs a redeploy for each change and doesn't showcase Fabric Apps |
| **B (picked)** | **App database plus in-app editor** | **Editable after deploy and a showcase of the platform. More to build, and forkers must deploy the data service** |
| C | A now, B later | Defers the showcase value |

For editor permissions, the owner picked **an email allow-list in code,
enforced server-side** over "any signed-in user" (unsafe in shared
deployments) and "editors managed in the app" (still needs a first editor
in config, and more to build).

## Design

### Data model (`packages/data`)

Two entities. Scene bodies are stored as validated JSON so that the four
question kinds don't need four normalized tables of options, pairs and chart rows.

- **`ChapterContent`**: `id` (uuid), `chapterId` (text, max 32, one of the
  six ids, unique), `title` (max 120), `tagline` (max 200).
- **`SceneContent`**: `id` (uuid), `chapterId` (text, max 32), `sceneKey`
  (text, max 80, the existing scene `id`, unique), `position` (int), `kind`
  (text, max 16), `body` (text, max 4000, JSON of the scene minus
  `id`/`kind`).

Permissions on both entities:
- `authenticated` can read, with no policy.
- `create`, `update` and `delete` are allowed for `authenticated` with a policy
  built from the editor list: `claims.email.eq(e1).or(claims.email.eq(e2))…`.

### Editor list (`packages/shared`)

**The owner's decision:** editor emails are an **uncommitted local setting**, so no
real addresses go into the public repo or get inherited by forks. A single
comma-separated variable, `EDITOR_EMAILS`, lives in a git-ignored env file
(a committed `.env.example` documents it). Upstream ships with no editors.

`packages/shared/src/editors.ts` exports `parseEditorEmails(raw)` and
`isEditor(list, email)`. The data entities read `EDITOR_EMAILS` when the schema
is applied, to build their policy. The frontend receives the same value at
build time (through Vite env or `define`) to show the editor. *Builder:*
confirm early that `rayfin up db apply` evaluates the entity module with the
env loaded, and choose the env file location so that both readers see one
file. If the list is empty, the policy has to
deny all writes. Because the policy DSL has no literal `false`, use a sentinel
`claims.email.eq('no-editors-configured')`. Changing the list needs a schema
apply (`rayfin up db apply`) and a redeploy. That gets documented.

The server comparison is case-sensitive. The UI check lowercases both sides
for display only, and the guide tells forkers to copy the exact sign-in email.

### Shared contracts and validation (`packages/shared`)

Move the scene and chapter types from `game/types.ts` into
`@rayfin-app/shared` (the frontend re-exports them). Add pure validation:

- `validateScene(scene)` returns field-level errors. It covers the rules
  currently in `content.spec.ts` (explanation length, source URL rules,
  non-empty difficulties, answer index in range, at least two arrange items or
  match pairs, unique option text, and so on), plus body size ≤ 4000.
- `validateChapter(chapter)` covers unique scene keys and at least 4
  questions per difficulty.
- `content.spec.ts` becomes tests of these validators run against the
  starter content, so the build-time and editor rules are one implementation.

### Loading content in the game (`packages/frontend`)

- Starter content stays in `game/content/` as the seed and empty-database fallback.
- A `useChapters()` hook (React context at the game root) loads both entities
  through `await getRayfinClient()`, pages through the results, and assembles
  `Chapter[]` in the fixed map order. For each chapter:
  - No rows for that chapter at all: use the starter content for it, and the
    editor shows it as "starter".
  - Rows present: use the database version.
- The loader returns one of three states: loading, ready, or error. On error it
  shows an actionable message with a Retry button and never falls back to
  starter content. Only documented transient errors are retried, with
  bounded attempts.
- *Builder's call, from the review:* writes aren't atomic, so database
  content can be reachable but invalid (a half-finished copy, two editors
  racing, a bad JSON body). The loader runs `validateChapter` on every chapter
  it reads. If any chapter is invalid, players get a blocking error that names
  the chapter and the problem and asks an editor to fix it. It never falls
  back to starter content and never skips scenes. Editors still reach the
  editor from that error screen, where the broken chapter is flagged and
  "Reset chapter to starter" is available. The copy/seed action re-validates
  after writing and reports any partial failure, so it can be run again.
- `GameApp`, `WorldView` and `AttractWorld` take chapters from the hook
  instead of the static import.
- The attract-mode world on the title screen may use starter content while
  loading, because it's decoration only.

### Editor UI (`packages/frontend`)

- An "Edit questions" entry in the title menu, visible only to editors. It
  opens a new `editor` screen in the game's visual style. Read
  `app-design` before building.
- Layout: a chapter list on the left. On the right: chapter title and tagline,
  an ordered scene list (move up/down, edit, delete with confirm), "Add
  question" (choose a kind) and "Add story", and per-difficulty question counts
  with pass/fail markers.
- Scene form per kind, with repeating rows for options, items, pairs and
  chart rows, plus a correct-answer picker. Validation runs live, and Save is
  disabled while there are errors, with the reasons listed.
- Deletes and saves that would push a difficulty below 4 questions are blocked
  with the reason.
- "Copy starter questions into the database": shown when a chapter has no
  rows. It writes that chapter's starter content. A "Copy all" button handles
  every un-seeded chapter. It's idempotent per chapter (skipped if rows exist).
- "Reset chapter to starter": deletes that chapter's rows after a confirm, so
  it falls back to starter content. *(Builder's call; included because it's
  cheap and helps forkers recover.)*
- Write failures (including a 403 from a stale editor list) are shown inline
  with an explanation. Edits aren't lost from the form.

### Saving and ordering

- Reordering rewrites `position` for the affected chapter (61 scenes total,
  so batch updates are fine).
- New scenes get a `sceneKey` of `<chapterId>-<slug>-<short random>`, and
  uniqueness is checked against the loaded chapter.
- A scene key can't be edited once created, because campaign progress
  references scene ids.

### Docs

Add a "Make it yours" README section: how to set `EDITOR_EMAILS` in the local env file, apply the
schema and redeploy, the email case caveat, copying the starter questions,
and the chapter/region limitation.

## Verification

- Validators: unit tests over the starter content plus targeted failing cases.
- Root gates: typecheck, build, lint, test.
- Browser check: as an editor, seed, edit, reload and see the change in the
  game; reorder; delete; reset. As a non-editor (or with the email removed),
  the editor is hidden and a direct write is refused by the server.
- Confirm early what Fabric sign-in puts in the `email` claim (UPN vs mail,
  guest accounts), because the case-sensitive match depends on it.
- Confirm early that DAB enforces an email-only (claims-only, no `@item`)
  policy on **create** for MSSQL. If it doesn't, stop and return to the owner
  with options.

## Left to the builder

Exact component structure, form widgets, JSON body shape details, paging
mechanics, styling within the existing design tokens, and the wording of
messages.
