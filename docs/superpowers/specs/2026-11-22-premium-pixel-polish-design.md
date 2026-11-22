# Fabric Quest premium pixel polish: design

Builds on `2026-11-21-fabric-quest-jrpg-design.md`. Gameplay, content, scoring and auth are unchanged.

## Intent and why

The game plays well, but it doesn't yet look premium. Two things hold it back:

- The menus (title, difficulty, summary) still use the old quiz look: paper background, teal, rounded sans-serif. The game itself uses a navy pixel style, so moving between them feels like switching between two apps.
- The world art is flat.

The user wants direction A, a **polished pixel JRPG**. The whole game should read as one crafted pixel product, and the battles and questions should look like a JRPG, not a web form. The game also serves as a showcase of how far a Fabric App can go, so this polish is part of the message.

## Goals

1. **One pixel UI kit** used by every screen and overlay:
   - window frame: navy fill, cream pixel border, dark outer ring, stepped corners
   - pixel buttons
   - a command-menu option list with the ▶ cursor
   - segmented pixel HP bars
   - pixel badges and chips
   - pixel-font headings and numbers (Pixelify Sans)
   - a readable body font for long question text (Instrument Sans)
   - It replaces the scoped `.rpg-panel` token hack with real components plus tokens.
2. **Battles look like a JRPG battle:**
   - **Transition in:** a short pixel-wipe or flash, then the foe drops in.
   - **Arena:** a stage with a ground strip in the region's palette and a shadow ellipse under each fighter. The foe idles with a bob.
   - **Command window:** the question sits in a bottom/side command window, with options as a JRPG command list. ↑/↓ moves the cursor, Enter or Space selects, and the mouse still works.
   - **Hits:** a white flash on the target, a pixel-font damage number that pops and floats, and a short shake.
   - **Feedback:** a battle message window ("Silo Slime takes 100 damage!") holds the explanation and the Learn link.
   - Arrange and match puzzles appear as pixel cards inside the same window.
   - The chart gets a pixel window frame.
3. **Richer world art:**
   - tile variants (several grass and stone variants, flowers)
   - shading on walls and trees
   - water that animates in 2 frames
   - soft drop shadows under every sprite
   - larger, more detailed character sprites at the same 16 px grid
   - a prettier hub: cottages with roofs, a fountain, lamps
4. **Atmosphere:**
   - Camera filters: a soft vignette and a gentle per-region colour grade.
   - Glows (point lights or the Glow filter) on lava, crystals and hub lamps.
   - Ambient particles per region:
     - water sparkles in OneLake
     - embers in the Foundry
     - motes in the Spire
     - dust in the Citadel
     - star twinkles in the Observatory
     - sparks in the Forge
   - All of it toned down under reduced motion.
5. **Menus as game screens:**
   - **Title:** a cinematic screen with the live world slowly panning behind a framed logo and a "Press Start" prompt.
   - **Difficulty:** three save-slot style windows.
   - **Summary:** a quest-log window with region badges, a rank title and per-region progress bars.
   - **HUD:** pixel windows and a segmented HP bar.
6. **Motion** (Emil Kowalski principles):
   - purposeful, short and interruptible
   - ease-out curves for entrances; springs only where there is physical feel (windows popping, hits)
   - nothing slower than about 300 ms for UI feedback
   - `prefers-reduced-motion` respected everywhere
7. **README:** a proper README with what the game is, a screenshot, features, how to run it locally (rayfin-local and `npm`), controls, project structure, how content is verified, tests and checks, the Fabric App limits it demonstrates, and credits and licence.

## Non-goals

- No gameplay, content, scoring or difficulty changes.
- No external art or audio assets. Everything stays generated in code.
- No new npm dependencies, beyond fonts loaded from Google Fonts as today.
- No Fabric deployment.

## Anti-goals

- No copying any existing game's look, characters or UI.
- No illegible pixel body text: long questions must stay easy to read.
- No motion that delays answering, and nothing that runs on every keystroke.
- Never break keyboard and screen-reader access (roles and labels stay).
- No regressions in the existing tests.

## Constraints

- React 19, Tailwind v4 tokens, framer-motion, Phaser 4.2.1, all already installed.
- Laptop first (1280×800 target). The layout must not break at about 800 px wide.
- The final gates per AGENTS.md: typecheck, build, lint, test, `validate:visual`, then a browser check on localhost via rayfin-local.

## Approaches

- **A. Polished pixel JRPG (chosen by user).** One pixel UI kit, richer generated art, Phaser 4 camera filters and lights, and the menus rebuilt as game screens.
- B. Modern glassy console UI over the pixel world. Rejected because it reads as two products.
- C. Illustrated vector art. Rejected because it's the largest rewrite and throws away the art.

## Decided how

- **Pixel UI kit:** `src/game/rpg/ui/kit.tsx` exports `PixelWindow`, `PixelButton`, `CommandList`, `PixelBar` and `PixelChip`, with global CSS for the stepped frame, in light and dark (the game UI is always "night window" styled, like the HUD).
- **Battle option lists** use `CommandList`, which has arrow-key navigation (roving focus). `OptionList` is replaced. Arrange and match keep their logic and are restyled through the kit.
- **The title screen** mounts the Phaser world in a non-interactive "attract" mode (camera pans; no player input; no bus events), behind the React title.
- **World art** stays in `textures.ts`, with more frames and variants. Lighting and filters go in `WorldScene`.

## Builder-check calls (my calls)

- **Scope is every overlay and screen.** That covers battle, dialogue box, chest card, region banner, toasts, HUD, title, difficulty and summary, plus the shared quiz pieces they use: `Feedback`, `ArrangeScene`, `MatchScene` and `StoryChart`. `.rpg-panel` is retired in favour of the kit.
- **The battle arena stays a React/CSS overlay**, animated with framer-motion and CSS. There is no new Phaser scene and no bus change.
- **WebGL effects are enhancements, never requirements.**
  - Camera filters (vignette and colour grade) apply only when the renderer is WebGL.
  - Glows are additive-blended sprites, which work on Canvas too, rather than point lights.
  - On Canvas the world still looks complete, just without the filters.
- **Attract mode is allowed on the title screen.** `PhaserGame` gets `mode: 'play' | 'attract'`. Attract mode mounts the world with no creatures, bosses or input, and only a slow camera pan along a fixed path. It's destroyed when the title unmounts, so only one Phaser instance ever exists at a time.
- **Tests keep their contract, not their markup.** These must stay identical:
  - the roles and accessible names tests rely on: buttons named by option text, `progressbar` "Your HP" and "Foe HP", list items for arrange cards, "Continue", "Run away", "Lock in order" and "Check matches"
  - the dialog labels
  - the "Player status" status

  Tests are updated only where a markup change is intended. `CommandList` adds arrow-key navigation, and it gets its own test.

## Left to the builder (my calls)

- exact palettes, sprite detail, tile variants and particle tuning
- the wipe-transition style
- README wording and the screenshot (captured from the running app and committed under `docs/images/`)
