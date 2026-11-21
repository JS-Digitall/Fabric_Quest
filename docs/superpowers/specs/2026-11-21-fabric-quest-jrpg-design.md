# Fabric Quest JRPG: design

Supersedes the presentation layer of `2026-11-21-fabric-quest-design.md`. Audience, goals, verified content, difficulty, scoring and anti-goals from that doc still apply unless changed here.

## Intent and why

The quiz version taught well, but it didn't show how far a Fabric App can go. The user wants a JRPG: the player walks through a world of Fabric, explores it, and learns through encounters. The app itself becomes the proof of what a Fabric App can do: a real-time game engine, generated pixel art, sound and React UI, all behind Fabric sign-in.

## Goals

- **Top-down pixel-art overworld.** It has six regions, one per existing chapter:
  - OneLake Shore (`onelake`)
  - Data Factory Foundry (`ingest`)
  - Semantic Spire (`semantic`)
  - Governance Citadel (`governance`)
  - IQ Observatory (`fabriciq`)
  - App Forge (`apps`)

  A hub village sits in the middle. All regions are reachable from the start.
- **Movement and interaction.** Arrow keys or WASD move the player, with a camera follow and collisions. Space or Enter talks to NPCs and opens chests.
- **NPCs.** Each region's existing `dialogue` scenes become an NPC (Mira, Jonas, Priya, Elif and Sam) standing at the region entrance.
- **Chests.** Each region has 2 chests. Opening one shows a fact card: the explanation of one of that region's questions plus a Learn link. Chests award no points.
- **Encounters.** "Data Chaos" creatures roam each region. Touching one starts a turn-based battle.
- **Battles.**
  - The battle overlay shows player HP, a creature sprite with HP, and one question from that region at a time.
  - A correct answer is an attack: damage equals that question's points (0–100). A wrong or partial answer earns less damage, and the creature hits back for 20 HP.
  - Each creature has 100 HP, and a battle is exactly one question.
  - Each region has a **boss**. It sits at the far end of the region and uses that region's arrange or match puzzles, plus the dashboard question where there is one. Boss HP equals 100 × its question count, and the boss battle runs those questions in sequence.
  - Fleeing is allowed in normal battles but not against bosses.
- **Question pool.** Each region's questions are filtered by difficulty with the existing `scenesFor`. Every question is asked at most once per campaign.
  - Normal creatures draw from the region's `choice` questions.
  - The boss gets every `arrange`, `match` and `dashboard` question in the region.
  - A region is **cleared** when its boss is defeated and no unanswered choice question remains. Defeated creatures don't respawn. The region spawns exactly as many creatures as it has choice questions for the difficulty.
- **Scoring.** The existing `scoreAnswer` (hints still halve points on Beginner) feeds per-region results through `recordResult`. The summary screen is reused.
- **HP.** The player has 100 HP. At 0 HP the player respawns at the hub with full HP. No score is lost, and the question that was being asked goes back into the pool.
- **HUD.** A React overlay shows:
  - the region name and difficulty
  - HP and score
  - a minimap drawn from the tile map
  - an FPS meter with an entity count (the "pushing the limits" readout)
  - a mute toggle
  - a Summary button
- **Juice.** Generated chiptune sound effects via WebAudio (step, talk, hit, victory), with mute on by default until the first key press. Particles on hits, screen shake, tweened region-title banners and a day-tint shader-free colour overlay. All of it respects `prefers-reduced-motion`: no shake, fewer particles.
- **Region info sign.** The App Forge has a sign that lists the real limits from the Rayfin guide. That content already exists in the `apps` chapter.

## Non-goals

- Persistence, save slots, leaderboards and multiplayer.
- Touch and mobile controls (target is laptops).
- Inventory, equipment, levelling and XP curves (score is the progression).
- External art or audio assets.

## Anti-goals

- Recreating any existing game's world, characters, art, music or look. Everything stays original: a Fabric-themed world, generated pixel art and generated sounds.
- Unverified Fabric facts. Content stays limited to the verified chapter files.
- Touching auth, `AuthGate` or `assetAccess: protected`.
- Using browser storage as a database.

## Constraints

- Phaser `4.2.1`, pinned exactly and added to `@rayfin-app/frontend`. It's the only new dependency.
- Phaser can't run in jsdom. Tests mock the Phaser mount, and the logic is tested as pure functions.
- Runs locally via rayfin-local. There is no Fabric deployment.
- Final gates per AGENTS.md: typecheck, build, lint, test, `validate:visual`, then a browser check on localhost.

## Approaches

- **A. Phaser engine plus React overlays (chosen).** Phaser handles the world, camera, physics, sprites, particles and tweens. React renders the dialogue, battle, HUD and menus over the canvas, communicating through a typed event bus. This is the fastest route to a real JRPG feel, and adds about 1 MB.
- B. Own canvas engine. No dependency, but a lot more hand-written movement, collision and animation code for a less polished result.
- C. DOM/CSS tile grid. Low performance ceiling, which defeats the "push the limits" purpose.

## Decided how

- **Pure logic in `src/game/rpg/`:**
  - `world.ts`: the tile map as string rows, plus region rectangles, spawn points, NPCs, chests and the boss location.
  - `campaign.ts`: per-region question pools, encounter selection, battle state reducer and region cleared check.
- **Phaser code in `src/game/rpg/phaser/`:**
  - `textures.ts` generates pixel art from code-defined palettes and pixel strings.
  - `WorldScene.ts`.
  - `bus.ts` holds the typed event emitter.
  - `PhaserGame.tsx` mounts and destroys the game.
- **React overlays in `src/game/rpg/ui/`:**
  - `Hud`, `DialogueBox`, `ChestCard` and `BattleScreen`.
  - `BattleScreen` reuses `OptionList`, `ArrangeScene`, `MatchScene`, `StoryChart` and `Feedback`.
- **Flow:** title → difficulty → world. The world opens the summary. The old map and chapter player are removed, and the old quiz components are reused inside battles.
- **Phaser pauses input and movement** while a React overlay is open.
- **Fixes carried over from the quiz browser run:**
  - Feedback is judged by correctness, not points.
  - Remove the literal backticks in the KQL explanation.
  - Matches reveal the correct partner after locking.

## Builder-check calls (my calls)

- **Normal creatures** always leave after their one question. They're defeated if your damage reaches 100, otherwise they flee. Either way the question counts as answered and scored, and the creature is gone. Its HP bar is just the visual for your points.
- **Bosses** have HP of 100 × their *remaining* questions. If you die mid-boss, you keep the questions you already answered (and their points). You respawn at the hub and walk back, and the boss resets to the HP of its remaining questions.
- **Chests don't reveal question answers.** Each one restores 40 HP and shows a codex card: the region's tagline plus a Learn link to that region's main source page.
- **Content guarantee.** The content test is extended so every region × difficulty has at least 1 choice question and at least 1 boss question. If a combination fails, the content tags get adjusted (still verified facts only).
- **Results** are recorded per region as you go: `recordResult(region, answeredScore, answeredMax)` runs after every answer. The summary is available at any time and shows partial progress.
- **NPCs are optional and gate nothing.** Each region's NPC speaks that chapter's intro dialogue, and the outro dialogue plays as a banner when the region is cleared. The App Forge uses the `apps` chapter speakers ("You" intro, Mira outro).

## Left to the builder (my calls)

- The exact map layout and tile palette, the sprite designs, creature names per region, and the sound timbres.
- The battle animation details.
- Map size: around 96×72 tiles at 16 px, rendered at 3× zoom.
