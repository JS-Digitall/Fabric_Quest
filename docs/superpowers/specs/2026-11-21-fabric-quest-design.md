# Fabric Quest — design

## Intent and why

A single-player story-campaign game, running as a Fabric App, that teaches colleagues (internal enablement) and conference visitors (booth play) how Microsoft Fabric works and which tool fits which job. It doubles as a showcase: the app itself demonstrates how rich the visuals in a Fabric App frontend can be, and its finale shows where Fabric Apps hit their limits.

## Goals

- Story campaign: the player is the new data lead at a fictional company (my call: "Northwind Outfitters", clearly fictional). Each chapter is a business problem solved by choosing and assembling the right Fabric tools.
- Six chapters, ~5 minutes each, freely selectable from a chapter map:
  1. OneLake and Fabric basics
  2. Getting data in (Data Factory, Lakehouse)
  3. Semantic models and Power BI
  4. Governance (workspaces, roles, Purview, sensitivity labels)
  5. Fabric IQ
  6. Finale: building a Fabric App, and where its limits are
- Three difficulties chosen at start: Beginner (hints, simpler questions), Practitioner (realistic trade-offs), Expert (edge cases and limits). Difficulty selects which question variants appear and whether hints show.
- Mixed mechanics per chapter: story dialogue scenes, scenario choices ("which tool?"), recall questions, and at least one visual interaction (drag-to-build pipeline, ordering, matching).
- Every answer reveals a short explanation with a Microsoft Learn link. Every fact is verified with the Microsoft Learn MCP tools before it ships.
- Visual showcase: animated scenes and transitions (framer-motion), custom SVG illustrations of Fabric architecture, charts on in-game dashboards (visuals pack) using clearly labelled fictional story data.
- Score per chapter and a final summary screen. Progress lives in React state only (lost on reload — accepted).

## Non-goals

- No persistence, leaderboard, accounts beyond the existing sign-in, or admin content editor (possible v2).
- No Fabric deployment in this round.
- No multiplayer / quiz-show mode.

## Anti-goals

- Wrong or unverified Fabric facts — worse than a missing question.
- Generic quiz-app look; it must feel like a crafted game.
- Touching the auth bootstrap, provider, `AuthGate`, or `assetAccess: protected`.
- Using localStorage/sessionStorage as a database.

## Constraints

- Template: React 19 + Vite + Tailwind v4 tokens in `packages/frontend/src/global.css`; framer-motion and lucide-react already installed. No new dependencies beyond the visuals pack.
- Local run via rayfin-local (community MIT tool, emulates Fabric sign-in locally). Requires the user's OK to download its ~8.5 MB Windows release.
- Final validation per AGENTS.md: typecheck, build, lint, test, visuals validator, browser check on localhost.

## Approaches

- **A. Pure React with bundled typed content (chosen).** Content in a typed module; visuals from framer-motion, SVG, visuals pack. Least machinery; shows what a plain Fabric App frontend can do.
- B. Questions as app-owned records (data-modeling pack). Enables admin editing and leaderboard, but much more to build and persistence wasn't wanted. Deferred to v2.
- C. Game engine (Phaser/PixiJS). Heavy dependency, looks like a game embedded in an app, weakens the showcase. Dropped.

## Decided how

- Apply only the `visuals` pack.
- Content: `packages/frontend/src/game/content/*.ts` — one file per chapter, typed `Chapter → Scene[]`, each question with per-difficulty variants, correct answer, explanation, `learnUrl`.
- Screens: title → difficulty pick → chapter map → chapter player (scene sequence) → chapter result → final summary.
- Finale chapter content comes from installed Rayfin docs (`known-limitations.md`, connectors docs), e.g. Kusto/KQL sources unavailable, default page size 100, no many-to-many relationships, no `count()` on the fluent client.

## Answered by the user

- Target device: laptops only (desktop browser, mouse + keyboard). Touch is not a target; keyboard alternatives for drag stay for accessibility.
- rayfin-local v0.2.11 (Windows zip, SHA256-verified) may be downloaded and installed to `%LOCALAPPDATA%\Programs\rayfin-local` for localhost testing.

## Builder-check calls (my calls)

- Scene types are first-class in the content schema: `dialogue`, `choice` (single answer), `arrange` (order steps / build a pipeline), `match` (pair tool ↔ job), `dashboard` (story chart + question). Drag uses framer-motion (`Reorder`/drag), with a tap-to-select + keyboard alternative so touch and keyboard both work. No dnd library.
- Charts appear in chapter 3 (semantic model → report) and chapter 6 (app dashboard), labelled "Fictional story data". `validate:visual` covers only those pack-based specs.
- Content volume: per chapter a pool of ~8 interactions, each tagged with the difficulties it appears in (not 3 full variants), so ~50 items total. Beginner also gets a hint button.
- Scoring: 100 points per correct answer on first try, no retries; `arrange`/`match` give partial credit per correct position/pair; using a hint halves that item's points. No pass threshold. Replaying a chapter replaces its score.
- All chapters unlocked from the start; the summary shows completed chapters and appears once any chapter is done.
- Sources: Microsoft Learn only (chapters 1–5), installed Rayfin docs for Fabric App limits (chapter 6). A fact that can't be verified is dropped. Integrity test checks every item has an answer, explanation, and a `learn.microsoft.com` URL (or a Rayfin docs reference in chapter 6).

## Left to the builder (my calls, marked)

- Exact visual direction, fonts, palette (via app-design skill).
- Question count per chapter (target 6–8 interactions per difficulty).
- Story names, dialogue, illustrations.
- UI language: English.
- Unit tests: scoring/difficulty filtering logic and a content integrity test (every question has an answer, explanation and Learn URL).
