# In-app Question Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Fabric Quest's chapter content into the app's Rayfin database, and add an in-app editor. Only editors listed by email can write.

**Architecture:** Two Rayfin entities hold chapter metadata and one JSON body per scene. Shared pure validators guard both the editor and the game loader. A React content provider loads the content and assembles `Chapter[]`, falling back to starter content per chapter only when that chapter has no rows. An editor screen behind the title menu writes through a small repository module.

**Tech Stack:** React 19 + Vite, Rayfin data (DAB on MSSQL) via `@microsoft/rayfin-client`, Vitest + Testing Library, Tailwind v4 tokens.

**Spec:** `docs/superpowers/specs/2026-11-23-question-editor-design.md`

## Global Constraints

- Every `@text` has an explicit `max`. Scene `body` max is `4000`.
- Chapter ids are fixed and in map order: `onelake, ingest, semantic, governance, fabriciq, apps`.
- Editor emails come from `RAYFIN_PUBLIC_EDITOR_EMAILS` (comma-separated) in git-ignored `rayfin/.env`. Vite sees it as `VITE_RAYFIN_EDITOR_EMAILS`. Nothing with real addresses is committed.
- An empty editor list must deny all writes. The policy uses the sentinel `claims.email.eq('no-editors-configured')`.
- Read is `authenticated` with no policy. Create, update and delete are `authenticated` with the editor policy. No `anonymous` roles.
- Never fall back to starter content on a load error or on invalid database content. Fall back only for a chapter with zero rows.
- Each chapter's story scenes are exactly two: Intro at position 0 and Outro last. They can be edited but not added, deleted or moved.
- At least 4 questions per difficulty per chapter. Saves that would break this are blocked.
- Scene keys can't be changed after creation.
- Keep `assetAccess: protected`, `AuthGate`, and password auth disabled. Use `await getRayfinClient()` for every data call.
- Don't change pinned dependency versions. Apply packs serially.
- User-facing copy talks about the game, not the platform.

## Review Focus

1. **Paging past 100 rows.** 61 scenes today, and forks will add more. The loader must page until `hasNextPage` is false. Test: the loader with a fake client that returns 2 pages assembles all rows (Task 4).
2. **Email case and whitespace in `RAYFIN_PUBLIC_EDITOR_EMAILS`.** `" Anna@x.com , "` should parse to `["Anna@x.com"]` (trimmed, empties dropped, case kept for the server). The UI check is case-insensitive. Test in Task 2.
3. **A corrupt `body` JSON or an unknown `kind` in a row.** Players should get a blocking error naming the chapter, not a crash. Test in Task 3.
4. **A partial "Copy starter" failure.** Running it again must finish the remaining scenes without duplicating existing keys. Test in Task 5.
5. **A write refused by the server (editor removed from the list after load).** The form keeps the user's edits and shows "You're not on this app's editor list". Test in Task 6.

---

### Task 1: Data service, entities and editor policy (with platform checks)

**Files:**
- Run: `npm run pack:add -- data-modeling`
- Delete: `packages/data/src/Item.ts` (the starter entity), and remove it from `packages/data/src/index.ts`/`schema.ts` and from `packages/shared/src/index.ts`
- Create: `packages/data/src/ChapterContent.ts`, `packages/data/src/SceneContent.ts`, `packages/data/src/editorPolicy.ts`
- Create: `packages/shared/src/editors.ts`
- Modify: `packages/data/src/index.ts` (and `schema.ts` if the pack seeds one), `packages/shared/src/index.ts`
- Create: `rayfin/.env.example` entry, or add the line to the existing example if there is one: `RAYFIN_PUBLIC_EDITOR_EMAILS=`
- Test: `packages/frontend/src/game/editors.spec.ts`

**Interfaces:**
- Produces (shared):
  - `parseEditorEmails(raw: string | undefined): string[]`
  - `isEditor(list: readonly string[], email: string | null | undefined): boolean` (case-insensitive, trimmed)
  - `NO_EDITORS_SENTINEL = 'no-editors-configured'`
- Produces (shared records):
  - `ChapterContentRecord { id: string; chapterId: string; title: string; tagline: string }`
  - `SceneContentRecord { id: string; chapterId: string; sceneKey: string; position: number; kind: string; body: string }`
  - `UniversalAppSchema = { ChapterContent: ChapterContentRecord; SceneContent: SceneContentRecord }`
- Produces (data): `editorPolicy(emails: string[])`, used in `@role('authenticated', ['create','update','delete'], { policy: editorPolicy(EMAILS) })`. Reads `process.env.RAYFIN_PUBLIC_EDITOR_EMAILS`. If that's unset, the entity module calls `process.loadEnvFile('<repo>/rayfin/.env')` guarded by an existence check.
- Field limits: `chapterId` max 32 (unique on ChapterContent); `title` max 120; `tagline` max 200; `sceneKey` max 80 (unique); `kind` max 16; `body` max 4000; `position` integer.

- [ ] **Step 1: Apply the pack.** Run `npm run pack:add -- data-modeling`. Expected: `data.enabled: true` and a `dialect` in `rayfin/rayfin.yml`, with no preserved-file warnings. If any file is preserved, stop and report it.
- [ ] **Step 2: Read the installed docs** listed in `.agents/skills/data-modeling/SKILL.md` (decorators, permissions, overview, known-limitations) for the exact decorator for integers and uniqueness.
- [ ] **Step 3: Write the failing test** `editors.spec.ts`:
  - `parseEditorEmails(' Anna@x.com , ,bob@y.org ')` → `['Anna@x.com','bob@y.org']`
  - `parseEditorEmails(undefined)` → `[]`
  - `isEditor(['Anna@x.com'], 'anna@X.com')` → `true`
  - `isEditor([], 'a@b.c')` → `false`
  - `isEditor(['a@b.c'], null)` → `false`
- [ ] **Step 4: Run** `npm test -- editors` → FAIL (module missing).
- [ ] **Step 5: Implement** `editors.ts`, the two entities, `editorPolicy` (`emails.length ? or-chain of claims.email.eq(e) : claims.email.eq(NO_EDITORS_SENTINEL)`), and the registrations. Remove `Item`.
- [ ] **Step 6: Run** `npm test -- editors` → PASS, then `npm run typecheck` → PASS.
- [ ] **Step 7: Platform check (must pass before Task 4).** Put your own sign-in email in `rayfin/.env` as `RAYFIN_PUBLIC_EDITOR_EMAILS`, then run `npx rayfin up` followed by `npx rayfin up db apply` (per the installed CLI guide). Verify all four, recording results in the commit message:
  - the generated DAB config shows the email policy on create, update and delete;
  - a create from the signed-in editor succeeds;
  - a create with the email removed from the list (re-apply) is refused;
  - the value of `session.user.email` matches what the server compares (log it once and remove the log).

  **If create can't be policy-guarded, or the email doesn't match, stop and report to the owner.** Don't work around it.
- [ ] **Step 8: Commit** `feat(data): question content entities with editor allow-list`.

### Task 2: Shared scene types and validators

**Files:**
- Create: `packages/shared/src/content.ts` (types moved from `packages/frontend/src/game/types.ts`: `Difficulty`, `ChapterId`, `CHAPTER_IDS`, `Scene` union, `Chapter`, `ChartData`)
- Create: `packages/shared/src/validate.ts`
- Modify: `packages/frontend/src/game/types.ts` (re-export from `@rayfin-app/shared`, keeping `Answer`, `ChapterResult` and `GameState` local)
- Replace: `packages/frontend/src/game/content.spec.ts` with validator-driven tests
- Test: `packages/frontend/src/game/validate.spec.ts`

**Interfaces:**
- `CHAPTER_IDS: readonly ChapterId[]`, in map order.
- `type Issue = { sceneKey?: string; field?: string; message: string }`
- `validateScene(scene: Scene): Issue[]`. Rules carried over from today's `content.spec.ts`, plus:
  - choice/dashboard: `options.length >= 2`, `0 <= answer < options.length`, unique options;
  - arrange: `items.length >= 2`, unique;
  - match: `pairs.length >= 2`, unique left values and unique right values;
  - dashboard: `chart.rows.length >= 1`;
  - `explanation.length > 20`;
  - `source` matches `^https://learn\.microsoft\.com/`, or starts with `rayfin-docs:` in chapter `apps`;
  - `difficulties` non-empty;
  - dialogue: speaker non-empty and `lines.length >= 1`;
  - serialized body ≤ 4000.
- `validateChapter(chapter: Chapter): Issue[]`. All scene issues, plus unique keys, exactly two dialogues (the first scene and the last scene), and ≥ 4 questions for each of `beginner | practitioner | expert`. Messages read like `Expert needs at least 4 questions (has 3)`.

- [ ] **Step 1: Write failing tests** `validate.spec.ts`:
  - every starter chapter → `validateChapter` returns `[]`;
  - choice with `answer: 4` and 4 options → one issue with `field: 'answer'`;
  - a chapter with a third dialogue → issue;
  - a chapter with the Intro moved to position 2 → issue;
  - a chapter with one expert question removed (from one that has exactly 4) → message `Expert needs at least 4 questions (has 3)`;
  - a body over 4000 chars → issue.
- [ ] **Step 2: Run** `npm test -- validate` → FAIL.
- [ ] **Step 3: Implement** the move and the validators. Make `content.spec.ts` assert the map order with `CHAPTER_IDS`, and assert `validateChapter(c)` is empty for each starter chapter.
- [ ] **Step 4: Run** `npm test` → all PASS. `npm run typecheck` → PASS.
- [ ] **Step 5: Commit** `refactor(content): shared scene types and validators`.

### Task 3: Row codec and chapter assembly

**Files:**
- Create: `packages/frontend/src/game/content/codec.ts`
- Test: `packages/frontend/src/game/content/codec.spec.ts`

**Interfaces:**
- `sceneToRow(chapterId: ChapterId, scene: Scene, position: number): Omit<SceneContentRecord,'id'>`. `body` is `JSON.stringify` of the scene without `id`/`kind`.
- `rowToScene(row: SceneContentRecord): Scene`. Throws `ContentError` on bad JSON or an unknown kind.
- `class ContentError extends Error { chapterId: ChapterId; issues: Issue[] }`
- `assembleChapters(meta: ChapterContentRecord[], rows: SceneContentRecord[], starter: Chapter[]): { chapters: Chapter[]; sources: Record<ChapterId,'starter'|'database'>; invalid: ContentError[] }`. Logic:
  - for each `CHAPTER_IDS`, a chapter with no scene rows is starter;
  - otherwise scenes are sorted by `position`, metadata comes from its `meta` row (or the starter title and tagline if there's no meta row), and the chapter is then run through `validateChapter`;
  - parse or validation failures go to `invalid` and never fall back.

- [ ] **Step 1: Write failing tests:**
  - round-trip every starter scene through `sceneToRow`/`rowToScene` to deep equality;
  - no rows → all six chapters `'starter'`;
  - rows for `governance` only → governance is `'database'`, the others `'starter'`;
  - a row with `body: '{'` → `invalid[0].chapterId === 'governance'`;
  - `kind: 'quiz'` → invalid.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(content): row codec and chapter assembly`.

### Task 4: Content provider and game wiring

**Files:**
- Create: `packages/frontend/src/game/content/ContentProvider.tsx`, `packages/frontend/src/game/content/load.ts`
- Modify: `GameApp.tsx`, `rpg/ui/WorldView.tsx`, `rpg/ui/AttractWorld.tsx`, `screens/menus.tsx` (the summary gets chapters from context)
- Modify: whatever renders `<GameApp />` under `AuthGate`, to wrap it in `<ContentProvider>`
- Test: `packages/frontend/src/game/content/load.spec.ts`, `packages/frontend/src/game/content/ContentProvider.spec.tsx`

**Interfaces:**
- `loadContent(client: Pick<AppClient,'data'>): Promise<{ meta: ChapterContentRecord[]; rows: SceneContentRecord[] }>`. Pages both entities with `.first(500).executePaginated()` and `.after(endCursor)` until `hasNextPage` is false. Retries only on `isThrottlingError`-style transient errors (check the installed client for the documented transient error), 3 attempts with 500/1000/2000 ms backoff.
- `type ContentState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'invalid'; errors: ContentError[] } | { status: 'ready'; chapters: Chapter[]; sources: Record<ChapterId,'starter'|'database'> }`
- `useContent(): ContentState & { reload(): Promise<void> }`
- `useChapters(): Chapter[]` returns the chapters when `ready`. `AttractWorld` uses `useChapters()` if ready, and starter chapters otherwise (decoration only).
- Player-facing states:
  - `error`: a full-screen game panel saying "Couldn't load the questions" with the message and a **Retry** button.
  - `invalid`: a panel listing each chapter title plus its first issue: "An editor needs to fix this before the game can start." Editors also get an **Open editor** button.

- [ ] **Step 1: Write failing tests:**
  - `loadContent` with a fake client returning 2 pages (`hasNextPage` true, then false) returns all rows;
  - a non-transient error rejects after 1 call;
  - a transient error followed by success resolves after 2 calls;
  - `ContentProvider` with a rejecting loader renders "Couldn't load the questions", and Retry calls the loader again;
  - with an invalid row, it renders the chapter title and the issue message and never renders the world.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, replacing the three static `chapters` imports. **Step 4: Run** `npm test` → PASS (existing `game.spec.tsx` and `battle.spec.tsx` pass with a provider wrapper or a test helper supplying ready starter content).
- [ ] **Step 5: Commit** `feat(game): load chapters from the database with starter fallback`.

### Task 5: Content repository (writes)

**Files:**
- Create: `packages/frontend/src/game/editor/repo.ts`
- Test: `packages/frontend/src/game/editor/repo.spec.ts`

**Interfaces (all take `client: Pick<AppClient,'data'>` first and throw `WriteRefusedError` on a permission refusal):**
- `copyStarter(client, chapter: Chapter, existingKeys: Set<string>): Promise<{ written: number; failed: string[] }>`. Upserts the meta row and creates only missing scene keys, at their starter positions.
- `saveChapterMeta(client, chapterId, { title, tagline })`
- `saveScene(client, chapter: Chapter, scene: Scene, rowId: string | null)`. Validates `{...chapter, scenes with scene replaced or appended before Outro}` with `validateChapter` first, and throws `ValidationBlockedError(issues)` without writing if there are issues.
- `deleteScene(client, chapter: Chapter, sceneKey: string, rowId: string)`. Same pre-validation. Dialogues are refused.
- `moveScene(client, chapter: Chapter, rows: SceneContentRecord[], sceneKey: string, dir: -1 | 1)`. Can't cross the Intro or Outro. Rewrites `position` only on the rows whose position changed.
- `resetChapter(client, chapterId, rows: SceneContentRecord[], metaId: string | null)`. Deletes all of them.
- `newSceneKey(chapterId: ChapterId, prompt: string, taken: Set<string>): string` → `<chapterId>-<slug(prompt, 24)>-<4 base36 chars>`, unique against `taken`.
- `class WriteRefusedError extends Error {}` and `class ValidationBlockedError extends Error { issues: Issue[] }`.
- Map the client's 401/403 or authorization error (check the installed client's error type) to `WriteRefusedError`.

- [ ] **Step 1: Write failing tests** with a recording fake client:
  - `copyStarter` with 3 keys already present creates only the rest, and running it twice creates nothing the second time;
  - `copyStarter` where the 2nd create rejects → `failed` has 1 key, and the others were written;
  - `saveScene` that drops expert to 3 → `ValidationBlockedError`, with zero client calls;
  - `deleteScene` on the Intro → throws;
  - `moveScene` of the first question up → no-op;
  - a 403 from the fake → `WriteRefusedError`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(editor): content repository with pre-save validation`.

### Task 6: Editor screen

Read `.agents/skills/app-design/SKILL.md` first. Use the existing game kit (`rpg/ui/kit.tsx`, menu styles) and the `global.css` tokens.

**Files:**
- Modify: `useGame.ts` (`ScreenName` adds `'editor'`), `GameApp.tsx` (render `EditorScreen`), `screens/menus.tsx` (TitleScreen gets an optional `onEdit` and shows **Edit questions** only when it's set)
- Create: `packages/frontend/src/game/editor/EditorScreen.tsx`, `ChapterPanel.tsx`, `SceneForm.tsx` (one component switching on kind, with repeating rows for options, items, pairs and chart rows, and a correct-answer picker; dialogue shows speaker, lines and art from the art registry keys)
- Create: `packages/frontend/src/game/editor/useIsEditor.ts`: `isEditor(parseEditorEmails(import.meta.env.VITE_RAYFIN_EDITOR_EMAILS), useAuth().session?.user?.email)`
- Test: `packages/frontend/src/game/editor/EditorScreen.spec.tsx`

**Behaviour to pin:**
- The chapter list shows each chapter title with a **Starter** or **Saved** badge (from `sources`) and an error marker for invalid chapters.
- The selected chapter shows editable **Title** and **Tagline** fields, saved with `saveChapterMeta`. They're disabled for starter chapters until copied.
- For a starter chapter: **Copy starter questions into the database**. Above the list: **Copy all** (only for chapters still on starter content).
- Scene rows: move up/down (disabled at the bounds), edit, delete with a confirm dialog. Intro and Outro have only edit.
- Add question (pick a kind) inserts before the Outro. There's no add-story button.
- Per-difficulty counts with ✓/✗.
- The form validates live with `validateScene`. Save is disabled while there are issues, with the issues listed. `ValidationBlockedError` issues show above Save.
- `WriteRefusedError` keeps the form state and shows: "You're not on this app's editor list. Ask whoever deployed it to add your sign-in email."
- **Reset chapter to starter** asks for confirmation first.
- After any successful write, call `reload()`.

- [ ] **Step 1: Write failing tests:**
  - non-editor: the title screen has no "Edit questions";
  - editor: it does;
  - editing a choice so `answer` points past the options disables Save and shows the issue;
  - delete on the Intro isn't offered;
  - a refused save keeps the typed prompt text and shows the editor-list message;
  - Copy on a starter chapter calls `copyStarter`, then `reload`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat(editor): in-app question editor`.

### Task 7: Docs and final validation

**Files:**
- Modify: `README.md`. Add a "Make it yours" section covering:
  - setting `RAYFIN_PUBLIC_EDITOR_EMAILS` in `rayfin/.env` (copy the exact sign-in email, which is case-sensitive);
  - running `npx rayfin up` and `npx rayfin up db apply`, then redeploying after changing the list;
  - Copy starter questions;
  - the fixed six chapters and the Intro/Outro rule;
  - the 4-per-difficulty rule.
- Verify that `rayfin/.env` is git-ignored (it is, via `rayfin/.env*`) and that `rayfin/.env.example` is committed. Add a `!rayfin/.env.example` exception if the ignore pattern swallows it.

- [ ] **Step 1:** Update the README and `.env.example`, then `git status` shows no `rayfin/.env`.
- [ ] **Step 2: Gates, serially:** `npm run typecheck`, `npm run build`, `npm run lint`, `npm test`. All must pass.
- [ ] **Step 3: Browser validation** per `.agents/skills/app-validation/SKILL.md`, as an editor:
  - copy all starter content;
  - edit a question's prompt, reload, and see it in a battle;
  - reorder two questions and reload;
  - try to drop expert below 4 and see it blocked;
  - delete a question you added and reload;
  - reset a chapter, then see Starter again.

  With your email removed from the list (re-apply and rebuild): there's no editor entry, and a direct write is refused.
- [ ] **Step 4: Commit** `docs: make Fabric Quest yours with the question editor`.
