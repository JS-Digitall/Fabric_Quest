# Premium Pixel Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every screen of Fabric Quest look like one premium pixel JRPG, with JRPG-style battles and questions, a richer and more atmospheric world, and a proper README.

**Architecture:** A shared pixel UI kit (`rpg/ui/kit.tsx` plus `pixel.css`) replaces the `.rpg-panel` token hack. Every overlay and menu is rebuilt from the kit. World art is upgraded in `textures.ts` and `world.ts`. Atmosphere (filters only on WebGL, additive glow sprites, particles) lives in `WorldScene`. The title screen mounts the world in attract mode.

**Tech Stack:** React 19, Tailwind v4, framer-motion, Phaser 4.2.1, vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-22-premium-pixel-polish-design.md`

## Global Constraints

- No new npm dependencies. All art and sound stay generated in code.
- Keep the roles and accessible names the tests rely on:
  - option buttons named by their text
  - `progressbar` "Your HP" and "Foe HP"
  - arrange `listitem`s
  - the "Continue", "Run away", "Lock in order", "Check matches", "Show hint", "Summary", "Start the quest" and difficulty buttons
  - the dialog labels
  - the "Player status" status
- Respect `prefers-reduced-motion`. UI motion stays at 300 ms or less, with ease-out entrances and springs only for physical moments.
- Use pixel font (Pixelify Sans) for headings, labels and numbers, and Instrument Sans for body and question text.
- Laptop first (1280×800) and no breakage at 800 px.
- Don't touch auth, gameplay or content.
- Work on branch `feat/pixel-polish`. Run commands serially from the root.

## Review Focus

1. **Keyboard-only battle.** ↑/↓ moves the command cursor, Enter selects, and focus never escapes the battle window. Tested in Task 2.
2. **Canvas renderer.** Filters are skipped without crashing (the renderer type is checked). Checked in Task 5 by forcing `Phaser.CANVAS` once in the browser.
3. **Title, difficulty, then world** must leave exactly one Phaser instance (attract destroyed). Tested in Task 6 with the mount-count mock.
4. **Long question text** (the longest prompt is about 200 characters) must not overflow the command window at 800 px. Checked in Task 2 in the browser.
5. **Reduced motion** must have no shake, wipe or particle burst. Checked in Task 8 with emulated reduced motion.

---

### Task 1: Pixel UI kit

**Files:**
- Create `src/game/rpg/ui/kit.tsx` and `src/game/rpg/ui/kit.spec.tsx`.
- Add CSS to `src/global.css`: a `.px-window` frame with stepped corners via `clip-path`, `.px-button` and `.px-bar`. This replaces the `.rpg-panel` block.

**Interfaces (produces):**
```ts
export function PixelWindow(p: { as?: 'div'|'section'; tone?: 'night'|'parchment'; className?: string; children; ...aria }): JSX.Element
export function PixelButton(p: ComponentProps<'button'> & { variant?: 'primary'|'ghost' }): JSX.Element   // forwards ref
export function CommandList(p: { label: string; options: string[]; picked: number | null; answer: number | null; onPick(i: number): void }): JSX.Element
export function PixelBar(p: { label: string; value: number; max: number; color: string; segments?: number }): JSX.Element // role=progressbar
export function PixelChip(p: { children; tone?: 'gold'|'muted' }): JSX.Element
```

`CommandList` behaviour:
- It's a `ul` of option buttons. Each option's accessible name is its option text, and the letter badge is `aria-hidden`.
- It uses roving tabindex: ↑/↓ wrap, and Home/End jump.
- The ▶ cursor is shown on the active item.
- When `answer` is not null (locked), the correct option is marked with ✓ and the picked wrong option with ✗.

- [ ] Write the tests in `kit.spec.tsx`:
  - `CommandList`: ArrowDown moves focus to the next option; ArrowUp from the first wraps to the last; Enter on a focused option calls `onPick(i)` once; locked state disables the buttons.
  - `PixelBar`: exposes `aria-valuenow` and the label.
- [ ] Run `npx vitest run --root packages/frontend src/game/rpg/ui/kit.spec.tsx` and expect FAIL.
- [ ] Implement the kit. Expect PASS. Commit `feat: pixel UI kit`.

### Task 2: JRPG battle

**Files:** Modify `rpg/ui/BattleScreen.tsx`, `scenes/Feedback.tsx`, `scenes/ArrangeScene.tsx`, `scenes/MatchScene.tsx`, `scenes/DashboardScene.tsx` and `rpg/ui/battle.spec.tsx`. Delete `scenes/ChoiceScene.tsx` (replaced by `CommandList`).

- **Layout:** a stage on top (region-tinted sky gradient, pixel ground strip, shadow ellipses, the player on the left, the foe on the right, HP bars as `PixelBar` with 10 segments) and a command window below (prompt, hint, `CommandList` or arrange/match/chart).
- **Entrance:** a 250 ms pixel-wipe (a stepped `clip-path` animation), then the foe drops in with a spring.
- **Hit:** the foe flashes white (filter brightness) for 120 ms, a damage number floats up in pixel font, and there's a short shake. A player hit shakes the stage and flashes red.
- **Feedback** becomes a battle message window. Its first line is "{foe} takes {n} damage!" or "{foe} dodges!", followed by the explanation, the Learn link and Continue. Keep `role="status"` and the "Learn more" link name.
- **Arrange, match and chart** keep their logic but are restyled with kit classes.

- [ ] Add tests to `battle.spec`:
  - a keyboard-only battle (ArrowDown to the right option, then Enter) shows "takes 100 damage"
  - the existing tests keep passing
- [ ] Run and expect FAIL. Implement. Run the whole suite and expect PASS.
- [ ] Browser check at 800 px and 1280 px using the longest prompt (`ingest-gold`). Commit `feat: JRPG battle presentation`.

### Task 3: Overlays and HUD

**Files:** Modify `rpg/ui/Overlays.tsx` (DialogueBox, ChestCard, RegionBanner, Toast), `rpg/ui/Hud.tsx` and `scenes/DialogueScene.tsx` (unused now, so delete it if nothing imports it).

- **DialogueBox:** a `PixelWindow` with a portrait frame, a name plate chip, the typed text and a blinking ▼ advance marker.
- **ChestCard:** a parchment-tone `PixelWindow` with a codex seal.
- **RegionBanner:** pixel-font title with a ribbon.
- **Toast:** small `PixelWindow`.
- **HUD:** `PixelWindow`s, a 10-segment HP `PixelBar`, pixel-font score, pixel icon buttons, and a framed minimap.

- [ ] Run the existing tests (`game.spec`, `battle.spec`) and expect PASS. Browser check. Commit `feat: pixel overlays and HUD`.

### Task 4: World art

**Files:** Modify `rpg/world.ts` and `rpg/world.spec.ts` (new tile kinds `roof`, `lamp` and `fountain` in LEGEND/SOLID, plus hub layout), and `rpg/phaser/textures.ts`.

- **Tiles:**
  - 3 grass variants picked by position hash
  - shaded walls and stone
  - trees with a highlight and a darker underside
  - 2-frame animated water (via an index swap timer in the scene) and lava
  - shoreline sand edging
- **Sprites:** player and NPCs get outlines, two-tone shading and hair/clothes detail. Creatures get a glossy highlight. Bosses get a crown sparkle. A shared `shadow` texture is drawn under all sprites.
- **Hub:** cottages with roofs, a fountain in the plaza and 4 lamps.

- [ ] Update `world.spec`: every char maps to LEGEND, the new kinds exist, the hub has 4 lamps and 1 fountain, and spawn reachability still holds. Run and expect FAIL.
- [ ] Implement. Run and expect PASS. Browser check. Commit `feat: richer world art`.

### Task 5: Atmosphere

**Files:** Modify `rpg/phaser/WorldScene.ts`.

- **Camera filters:** a vignette (strength around 0.3) and a per-region colour grade (a ColorMatrix tint tween on region change), only if `renderer.type === Phaser.WEBGL`.
- **Glows:** additive-blend radial glow sprites (a generated soft circle texture) on lava, crystal and lamp tiles near the camera (pooled, about 60 max). They pulse gently.
- **Particles:** one emitter per region, active only while the player is in it (sparkles, embers, motes, dust, stars, sparks), with low quantity. With reduced motion they're off or a tenth of the amount.

- [ ] Browser check on WebGL. Force `Phaser.CANVAS` once and confirm there's no crash. Check the FPS stays at least as good as before in a visible pane. Commit `feat: world atmosphere`.

### Task 6: Menus as game screens

**Files:** Modify `rpg/phaser/PhaserGame.tsx` (adds `mode: 'play'|'attract'`), `rpg/phaser/WorldScene.ts` (attract mode: no player input, no creatures or bosses, camera pans along waypoints), `screens/menus.tsx` (Title, Difficulty, Summary) and `game.spec.tsx`.

- **Title:** the world in attract mode behind a dark gradient, a framed pixel logo "FABRIC QUEST" with a subtitle, a blinking "Press Enter or click to start" button (accessible name stays "Start the quest"), and the controls hint.
- **Difficulty:** three save-slot `PixelWindow`s, each with a pixel sprite, a level name, a blurb and stars.
- **Summary:** a quest-log `PixelWindow` with the rank title, region rows with a region-colour badge, a `PixelBar` and a percentage, and a "Back to the world" button.
- Remove the `Art` SVG illustrations (`game/art`) if nothing imports them.

- [ ] Test in `game.spec`: title shows 1 Phaser mount (attract); choosing a difficulty leads to the world with exactly one mounted instance (attract unmounted).
- [ ] Run and expect FAIL. Implement. Expect PASS. Commit `feat: menus as game screens`.

### Task 7: README

**Files:** Rewrite `README.md`. Create `docs/images/` screenshots captured from the running app: title, world and battle.

Sections:
- what it is and why
- screenshots
- features
- quick start (Node 22.13+, `npm install`, rayfin-local install and `rayfin-local serve`, or `npm run dev` with a Fabric backend)
- controls
- how it's built (stack, architecture diagram in text, folder map)
- content and fact verification (Microsoft Learn and the Rayfin guide, plus the `content.spec` guarantees)
- the Fabric App limits it demonstrates
- testing and quality gates
- deploying (pointer to the Rayfin CLI guide, with the reminder to confirm the workspace)
- credits and licence (MIT; rayfin-local is a community tool)

Keep the template's original sections that still apply.

- [ ] Commit `docs: README`.

### Task 8: Validation and finish

- [ ] Run the gates serially: typecheck, build, lint, test and `validate:visual` (chart validated in the browser).
- [ ] Browser run on rayfin-local at 1280×800 in light and dark, plus emulated reduced motion:
  - title
  - difficulty
  - world walk across 2 regions
  - NPC
  - chest
  - creature battle by keyboard only
  - boss with arrange, match and chart
  - summary
- [ ] Final whole-branch review, then merge into `main` (as the user asked for the last round). Push only if asked.
