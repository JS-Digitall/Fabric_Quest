# Fabric Quest JRPG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the quiz map with a top-down JRPG built in Phaser. Players walk six Fabric regions and fight question battles that use the verified content.

**Architecture:** Pure logic (world data, campaign/battle reducer) lives in `src/game/rpg/` and is unit tested. Phaser (`rpg/phaser/`) renders the world and talks to React over a typed event bus. React overlays (`rpg/ui/`) render the HUD, dialogue, chests and battles. Battles reuse the existing scene components.

**Tech Stack:** React 19, Vite, Tailwind v4 tokens, framer-motion, Phaser 4.2.1 (new, pinned exactly), WebAudio, vitest.

**Spec:** `docs/superpowers/specs/2026-11-21-fabric-quest-jrpg-design.md` (with `2026-11-21-fabric-quest-design.md` for content and scoring rules).

## Global Constraints

- Phaser `4.2.1` is the only new dependency, installed from the root with `npm install phaser@4.2.1 --save-exact -w @rayfin-app/frontend`.
- Don't touch auth, `AuthGate` or `assetAccess: protected`. Don't use browser storage for game state.
- Use only original art and sound, generated in code. Copy no existing game.
- Content comes only from the existing verified chapter files.
- Respect reduced motion: no shake and fewer particles when `prefers-reduced-motion` is set.
- Format with `prettier --single-quote --trailing-comma es5`.
- Run commands from the root, serially. Never run typecheck and build together.

## Review Focus

1. Dying mid-boss keeps the answered questions and resets boss HP to the remaining questions. Tested in Task 2.
2. A region with every question answered but the boss still alive is not cleared. Tested in Task 2.
3. Input leaking into Phaser while a React overlay is open (the player walks during a battle). Pause the scene on `overlay:open`. Checked in Task 6 in the browser.
4. Unmounting the game (Summary, then back) must destroy the Phaser instance with no duplicate canvas. Tested in Task 4 via the mock mount count.
5. A double-submitted battle answer must not score twice. Tested in Task 5.

---

### Task 1: Quiz fixes carried over + content guarantee

**Files:** Modify `scenes/Feedback.tsx`, `screens/ChapterPlayer.tsx`, `scenes/MatchScene.tsx`, `content/apps.ts`, `content.spec.ts`, `game.spec.tsx`, plus content tag tweaks if the new test fails.

- [ ] Write the tests:
  - `game.spec`: hint + correct shows /spot on/i and +50.
  - `content.spec`: every chapter × difficulty has ≥1 `choice` scene and ≥1 boss scene (`arrange | match | dashboard`).
  - `game.spec`: after a wrong match, each wrong left chip shows its correct partner text.
- [ ] Run `npx vitest run --root packages/frontend src/game` and expect FAIL.
- [ ] Implement:
  - `Feedback` gets a `correct: boolean` prop. The label is "Spot on!" when correct, "Partly right" when points > 0, otherwise "Not quite". The player computes `correct = scoreAnswer(scene, answer, false) === 100`.
  - The match lock state renders `→ {correct partner}` under each wrong left chip.
  - Remove the backticks in the `apps-kql` explanation.
  - Adjust difficulty tags until the guarantee passes, using existing verified items only.
- [ ] Run the tests again and expect PASS. Commit `fix: quiz feedback, match reveal, content guarantee`.

### Task 2: Campaign logic

**Files:** Create `src/game/rpg/campaign.ts` and `campaign.spec.ts`.

**Interfaces (produces):**
```ts
export type RegionId = ChapterId;
export interface RegionPool { choice: ChoiceScene[]; boss: QuestionScene[] }   // boss = arrange|match|dashboard
export function poolFor(chapter: Chapter, d: Difficulty): RegionPool;
export interface Campaign {
  difficulty: Difficulty; hp: number;                       // max 100
  answered: Record<string, number>;                         // sceneId -> points
  defeatedCreatures: string[]; bossesDefeated: RegionId[];
}
export function newCampaign(d: Difficulty): Campaign;
export type Battle =
  | { kind: 'creature'; region: RegionId; creatureId: string; queue: QuestionScene[]; foeHp: number; foeMax: number }
  | { kind: 'boss'; region: RegionId; queue: QuestionScene[]; foeHp: number; foeMax: number };
export function startCreatureBattle(c: Campaign, chapter: Chapter, creatureId: string): Battle | null; // next unanswered choice; null if none
export function startBossBattle(c: Campaign, chapter: Chapter): Battle | null;  // remaining unanswered boss questions; foeMax = 100*len
export interface AnswerOutcome { campaign: Campaign; battle: Battle | null; points: number; correct: boolean; foeDamage: number; playerDamage: number; result: 'continue' | 'won' | 'fled' | 'lost' }
export function answer(c: Campaign, b: Battle, a: Answer, usedHint: boolean): AnswerOutcome;
export function heal(c: Campaign, amount: number): Campaign;   // capped at 100
export function respawn(c: Campaign): Campaign;               // hp = 100, keeps answered
export function regionResult(c: Campaign, chapter: Chapter): ChapterResult; // answered score / answered max in this region
export function isCleared(c: Campaign, chapter: Chapter): boolean;          // boss defeated && no unanswered choice
export const CREATURE_HIT = 20;
```

Rules: `foeDamage = points`. `playerDamage = CREATURE_HIT` unless the answer was correct.
- A creature battle always ends after one answer: `won` if the foe's HP reaches 0, otherwise `fled`. The creature is added to `defeatedCreatures` either way.
- A boss battle shifts the queue, and is `won` when the queue is empty.
- A battle is `lost` when HP drops to ≤ 0 (HP is clamped at 0). A double answer for an already answered `sceneId` returns points 0 with the battle unchanged.

- [ ] Write tests for each rule above, plus:
  - mid-boss death followed by `startBossBattle` gives `foeMax = 100 × remaining`
  - `isCleared` is false while the boss is alive
  - double-answer protection
- [ ] Run and expect FAIL. Implement. Run and expect PASS. Commit `feat: rpg campaign logic`.

### Task 3: World data

**Files:** Create `src/game/rpg/world.ts` and `world.spec.ts`.

**Interfaces (produces):**
```ts
export const TILE = 16;
export type TileKind = 'grass'|'path'|'water'|'sand'|'stone'|'wall'|'tree'|'floor'|'lava'|'crystal'|'bridge'|'flowers';
export const SOLID: TileKind[];                           // water, wall, tree, lava, crystal
export const MAP: string[];                                // rows of chars, one char per TileKind (legend LEGEND)
export const LEGEND: Record<string, TileKind>;
export interface Region { id: RegionId; name: string; rect: { x: number; y: number; w: number; h: number }; tint: string }
export const REGIONS: Region[];                            // six, plus HUB {x,y,w,h}
export const SPAWN: { x: number; y: number };              // tile coords in hub
export interface Spot { id: string; region: RegionId; x: number; y: number }
export const NPCS: Spot[]; export const CHESTS: Spot[]; export const BOSSES: Spot[];
export function creatureSpots(region: RegionId, count: number): Spot[]; // deterministic walkable tiles in region
export function regionAt(x: number, y: number): RegionId | 'hub' | null;
export function walkable(x: number, y: number): boolean;
```

- [ ] Write tests:
  - all rows have the same length
  - every char is in LEGEND
  - SPAWN, NPCs, chests and bosses are walkable and reachable from SPAWN (BFS)
  - each region has 1 NPC, 2 chests and 1 boss inside its rect
  - `creatureSpots(r, 8)` returns 8 distinct walkable reachable tiles in the region
- [ ] Run and expect FAIL. Build the 96×72 map: hub in the centre, six regions around it joined by paths and bridges, each with its own terrain. Run and expect PASS. Commit `feat: rpg world map`.

### Task 4: Phaser world + mount + app flow

**Files:**
- Create `rpg/phaser/bus.ts`, `rpg/phaser/textures.ts`, `rpg/phaser/WorldScene.ts` and `rpg/phaser/PhaserGame.tsx`.
- Modify `GameApp.tsx`, `useGame.ts` and `game.spec.tsx`.
- Delete `screens/ChapterPlayer.tsx` and the `ChapterMap`/`ChapterResult` exports once unused (move the reused quiz tests to the battle in Task 5).

**Interfaces:**
```ts
// bus.ts — typed EventEmitter shared by Phaser and React
export type WorldEvent =
  | { type: 'npc'; id: string } | { type: 'chest'; id: string }
  | { type: 'creature'; id: string; region: RegionId } | { type: 'boss'; region: RegionId }
  | { type: 'region'; region: RegionId | 'hub' } | { type: 'fps'; fps: number; entities: number };
export type UiCommand =
  | { type: 'pause' } | { type: 'resume' } | { type: 'remove-creature'; id: string }
  | { type: 'remove-boss'; region: RegionId } | { type: 'respawn' } | { type: 'fx'; fx: 'hit' | 'heal' | 'victory' }
  | { type: 'open-chest'; id: string };
export function createBus(): { emit(e: WorldEvent): void; on(fn: (e: WorldEvent) => void): () => void; send(c: UiCommand): void; onCommand(fn: (c: UiCommand) => void): () => void };
// PhaserGame.tsx
export function PhaserGame(props: { bus: Bus; creatures: Spot[]; openedChests: string[]; defeatedBosses: RegionId[] }): JSX.Element;
```

The `useGame` screens become `title | difficulty | world | summary`. The `difficulty` action starts `newCampaign`.

- [ ] Install Phaser (Global Constraints command). Confirm `packages/frontend/package.json` has `"phaser": "4.2.1"`.
- [ ] Write tests in `game.spec.tsx`, with `vi.mock('./rpg/phaser/PhaserGame')` counting mounts and unmounts:
  - title → Beginner → world shows the HUD (role `status` with "HP")
  - Summary → back to world unmounts once and mounts once
- [ ] Run and expect FAIL. Then implement:
  - Textures generated from pixel strings: player with 4 directions × 2 walk frames, NPC, chest open/closed, one creature per region, one boss per region, and the tiles.
  - WorldScene: tile layer, arcade physics collision on `SOLID`, camera follow with 3× zoom, WASD/arrows, Space/Enter interaction within 1 tile, creature wander tweens, overlap emits `creature`/`boss`, a `region` event on region change, an `fps` event every 500 ms, and handling of `UiCommand`s.
  - PhaserGame creates the game in a ref'd div on mount and destroys it on unmount.
- [ ] Run tests and typecheck, expecting PASS. Commit `feat: phaser world`.

### Task 5: React overlays + battle

**Files:** Create `rpg/ui/Hud.tsx`, `rpg/ui/DialogueBox.tsx`, `rpg/ui/ChestCard.tsx`, `rpg/ui/BattleScreen.tsx`, `rpg/ui/WorldView.tsx` (wires bus, campaign, overlays) and `rpg/ui/battle.spec.tsx`.

**Interfaces:** `BattleScreen({ battle, difficulty, onAnswer(a, usedHint), onFlee?, outcome })`. It reuses `OptionList`, `ArrangeScene`, `MatchScene`, `StoryChart` and `Feedback`, keyed per question id.

`WorldView` owns `Campaign` state and calls the `campaign.ts` functions:
- It sends `pause` while any overlay is open and `resume` when it closes.
- After a win or flee it sends `remove-creature` or `remove-boss`.
- On `lost` it sends `respawn` and applies `respawn()`.
- After every answer it dispatches `finish` (`recordResult`) for that region.

- [ ] Write tests in `battle.spec.tsx`:
  - a creature battle with a correct answer shows "+100" and a foe HP bar at 0
  - a double click scores once
  - a boss with 2 questions advances to the second after Continue
  - a wrong answer reduces player HP by 20
  - fleeing is hidden for a boss
- [ ] Run and expect FAIL. Implement. Run and expect PASS. Commit `feat: rpg overlays and battles`.

### Task 6: Juice + validation

**Files:** Create `rpg/sound.ts` (WebAudio blips: step, talk, hit, heal, victory; muted until the first keydown; mute toggle). Modify WorldScene (particles, shake, region banner tween, reduced-motion checks) and Hud (FPS/entity meter, mute button).

- [ ] Run the gates serially: typecheck, build, lint, test, validate:visual. All should pass.
- [ ] Restart rayfin-local, open `http://localhost:5173/` and check that:
  - you can walk to every region
  - each region gets a banner
  - talking to an NPC works and opening a chest heals
  - a creature battle works, and so does a boss battle with arrange/match/dashboard
  - dying respawns you at the hub with answers kept
  - Summary shows partial results
  - light and dark modes both work
  - the console shows no errors
- [ ] Commit the fixes. Write the ledger.
