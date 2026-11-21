# Fabric Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single-player story-campaign game inside the Fabric App template that teaches Microsoft Fabric across six chapters and three difficulties, and that also shows off rich visuals.

**Architecture:** Everything is frontend-only. Typed chapter content lives in `packages/frontend/src/game/content/`, and pure engine functions handle filtering and scoring. One `useReducer` game state drives the screens (title → difficulty → map → chapter player → result → summary). There's no backend, and state is in memory only.

**Tech Stack:** React 19, Vite, Tailwind v4 tokens, framer-motion (installed), lucide-react (installed), visuals pack (`@microsoft/fabric-visuals` VegaVisual), vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-21-fabric-quest-design.md`

## Global Constraints

- No new dependencies beyond the `visuals` pack. Don't change pinned versions.
- Don't modify the auth bootstrap, provider, `AuthGate`, or `assetAccess: protected`.
- Don't use localStorage or sessionStorage for game state.
- Laptops only (mouse and keyboard). Every drag interaction has a keyboard alternative.
- Charts show the label "Fictional story data".
- Every fact comes from Microsoft Learn (chapters 1–5) or the installed Rayfin docs (chapter 6). Drop any fact you can't verify.
- Scoring: 100 points for a first-try correct answer, no retries, partial credit for arrange/match, a hint halves the points, no pass threshold, and a replay replaces the chapter's score.
- All chapters are unlocked. The UI is in English.
- Run commands from the workspace root. Never run typecheck and build at the same time.

## Review Focus

1. An empty pool after difficulty filtering, e.g. no Beginner items in a chapter. The chapter should still play (dialogue only), and the result screen shows 0/0 rather than NaN. Test it in Task 2.
2. A replayed chapter must replace its score, not add to it. Test it in Task 2.
3. Arrange and match by keyboard only. You must be able to finish with no mouse. Test it in Task 4.
4. Double-submitting an answer (a fast double click) must not score twice. Test it in Task 4.
5. The dark theme needs readable text and readable charts. Check it in the Task 6 browser pass.

---

### Task 1: Shell setup — visuals pack, remove the welcome page

**Files:**
- Modify: `packages/frontend/src/App.tsx`, `App.spec.tsx`, `Root.spec.tsx`, `vite.config.ts` (remove `sourceActivity: true`)
- Delete: `EmptyStatePreview.tsx`, `Welcome*`, `FabricAppMark.tsx`
- Create: `packages/frontend/src/game/GameApp.tsx` (placeholder heading "Fabric Quest")

- [ ] Run `npm run pack:add -- visuals`. Stop if it reports a preserved file.
- [ ] Follow the README section "Replacing the welcome". `App` renders `<GameApp />`, and the specs drop the `Welcome.activity` mocks but keep the auth-gate tests.
- [ ] Add a test to `App.spec.tsx`: `expect(screen.getByRole('heading', { name: /fabric quest/i })).toBeInTheDocument()`.
- [ ] Run `npm run typecheck`, then `npm test`. Both should pass.
- [ ] Commit `feat: game shell replaces welcome`.

### Task 2: Types and engine

**Files:** Create `packages/frontend/src/game/types.ts`, `engine.ts`, `engine.spec.ts`

**Interfaces (produces):**
```ts
export type Difficulty = 'beginner' | 'practitioner' | 'expert';
export type ChapterId = 'onelake' | 'ingest' | 'semantic' | 'governance' | 'fabriciq' | 'apps';
interface Base { id: string; difficulties: Difficulty[]; hint?: string; explanation: string; source: string }  // source: learn.microsoft.com URL or 'rayfin-docs:<path>'
export type Scene =
  | { kind: 'dialogue'; id: string; speaker: string; lines: string[]; art?: ArtId }
  | (Base & { kind: 'choice'; prompt: string; options: string[]; answer: number })
  | (Base & { kind: 'arrange'; prompt: string; items: string[] })            // items in correct order; UI shuffles
  | (Base & { kind: 'match'; prompt: string; pairs: [string, string][] })    // [left, right] correct pairs
  | (Base & { kind: 'dashboard'; prompt: string; chart: ChartData; options: string[]; answer: number });
export interface ChartData { title: string; x: string; y: string; rows: Record<string, string | number>[] }
export type ArtId = string; // keys of the illustration registry (Task 5)
export interface Chapter { id: ChapterId; title: string; tagline: string; scenes: Scene[] }
export type Answer = { kind: 'choice'; index: number } | { kind: 'order'; items: string[] } | { kind: 'pairs'; pairs: [string, string][] };
export function scenesFor(chapter: Chapter, d: Difficulty): Scene[];           // dialogue always kept
export function scoreAnswer(scene: Exclude<Scene, {kind:'dialogue'}>, a: Answer, usedHint: boolean): number; // 0..100
export function maxScore(scenes: Scene[]): number;                              // 100 × non-dialogue count
export interface GameState { difficulty: Difficulty | null; results: Partial<Record<ChapterId, { score: number; max: number }>> }
export function recordResult(s: GameState, id: ChapterId, score: number, max: number): GameState; // replaces
```

- [ ] Write the tests in `engine.spec.ts`:
  - `scenesFor` keeps the dialogue and drops items without the difficulty.
  - Choice: correct gives 100, wrong gives 0, correct with a hint gives 50.
  - Arrange: 2 of 4 positions correct gives 50.
  - Match: 3 of 4 pairs correct gives 75. Pair order doesn't matter.
  - `maxScore([])` is 0.
  - `recordResult` twice for the same chapter keeps only the last.
  - Partial credit uses `Math.round`.
- [ ] Run `npm test -- engine` and expect it to FAIL.
- [ ] Implement the engine. Run `npm test -- engine` and expect PASS.
- [ ] Commit `feat: game engine`.

### Task 3: Verified chapter content

**Files:** Create `packages/frontend/src/game/content/{onelake,ingest,semantic,governance,fabriciq,apps}.ts`, `content/index.ts` (`export const chapters: Chapter[]` in map order), `content.spec.ts`

- [ ] Write `content.spec.ts`:
  - There are 6 chapters with unique scene ids.
  - Every non-dialogue scene has an explanation, and its `source` matches `/^https:\/\/learn\.microsoft\.com\//` or (only in `apps`) `/^rayfin-docs:/`.
  - For each chapter × difficulty, `scenesFor` returns ≥ 4 non-dialogue scenes.
  - The choice/dashboard `answer` is in range. Arrange has ≥ 3 items, and match has ≥ 3 pairs with unique left and right sides.
  - Each chapter contains at least one arrange or match scene.
  - `semantic` and `apps` each contain a dashboard scene.
- [ ] Research each chapter with `microsoft_docs_search` / `microsoft_docs_fetch`. Use the installed `node_modules/@microsoft/rayfin-guide/assets/docs/known-limitations.md` and the connectors docs for `apps`. Write about 8 interactions plus 2–3 dialogue scenes per chapter, tagged with difficulties. Each item cites the page it came from.
- [ ] Run `npm test -- content` and expect PASS.
- [ ] Commit `feat: verified chapter content`.

### Task 4: Game flow and scene components

**Files:** Create `packages/frontend/src/game/useGame.ts` (reducer over `GameState` plus the current screen), `screens/{TitleScreen,DifficultyScreen,ChapterMap,ChapterPlayer,ChapterResult,SummaryScreen}.tsx`, `scenes/{DialogueScene,ChoiceScene,ArrangeScene,MatchScene,DashboardScene,Feedback}.tsx`, `game.spec.tsx`

**Interfaces:** each interactive scene is `({ scene, difficulty, onSubmit }: { scene; difficulty: Difficulty; onSubmit: (a: Answer, usedHint: boolean) => void })`. It shows `Feedback` (correct/incorrect, explanation, "Learn more" link to `source`) after the answer, then a Continue button. A hint button shows only for `beginner` when `scene.hint` exists.

- [ ] Write the tests in `game.spec.tsx`:
  - Title → pick Beginner → the map shows 6 chapters.
  - Playing a choice scene shows the explanation and a Learn link.
  - Double-clicking an option still records the score once.
  - Arrange can be finished by keyboard only: focus an item, press ArrowUp/ArrowDown to move it, press Enter to submit.
  - Match can be finished by keyboard: select the left item, then the right item.
  - Finishing a chapter shows the result. The summary lists the completed chapters.
- [ ] Run `npm test -- game` and expect it to FAIL.
- [ ] Implement it:
  - Arrange uses framer-motion `Reorder` plus arrow-key handlers.
  - Match uses click/Enter pairing with animated connector lines.
  - Dashboard uses `VegaVisual` with the "Fictional story data" caption.
- [ ] Run `npm test` and expect PASS.
- [ ] Commit `feat: playable game flow`.

### Task 5: Visual direction and illustrations

**Files:** Modify `packages/frontend/src/global.css`, `packages/frontend/index.html` (fonts). Create `packages/frontend/src/game/art/` (SVG illustration components plus an `art` registry keyed by `ArtId`, e.g. `onelake`, `pipeline`, `semantic-model`, `governance-shield`, `fabric-iq`, `app-limits`).

- [ ] Read `.agents/skills/app-design/SKILL.md` and its references. Pick a tone and a signature detail, then set the color, radius and font tokens for light and dark.
- [ ] Build animated SVG scenes for each chapter and the chapter-map illustration, using framer-motion entrance and path drawing. Respect `prefers-reduced-motion`.
- [ ] Run `npm run typecheck`, then `npm test`. Both should pass.
- [ ] Commit `feat: visual direction and illustrations`.

### Task 6: Local run and final validation

- [ ] Download the rayfin-local v0.2.11 Windows zip and verify its SHA256 against `SHA256SUMS.txt`. Unpack it to `%LOCALAPPDATA%\Programs\rayfin-local` (the user approved this). Run `rayfin-local --version`.
- [ ] Run these in order: `npm run typecheck`, `npm run build`, `npm run lint`, `npm test`, `npm run validate:visual`. All should pass.
- [ ] Start `rayfin-local serve` in the background and open `http://localhost:5173/`. Sign in through the local sign-in page.
- [ ] Follow the `.agents/skills/app-validation/SKILL.md` browser checks:
  - Play one chapter on each difficulty, using the keyboard for arrange and match.
  - Check the charts in light and dark themes.
  - Check that there are no console errors.
- [ ] Commit any fixes.
