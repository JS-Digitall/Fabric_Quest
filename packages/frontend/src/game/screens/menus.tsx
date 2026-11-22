import { motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

import { NPC_PALETTES, PLAYER_PALETTE } from '../rpg/phaser/textures';
import { PixelBar, PixelButton, PixelChip, PixelWindow } from '../rpg/ui/kit';
import { PersonSprite } from '../rpg/ui/Sprite';
import { REGIONS } from '../rpg/world';
import type {
  Chapter,
  ChapterResult as Result,
  Difficulty,
  GameState,
} from '../types';

const EASE = [0.23, 1, 0.32, 1] as const;

const DIFFICULTIES: {
  id: Difficulty;
  name: string;
  blurb: string;
  stars: number;
  palette: typeof PLAYER_PALETTE;
}[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    blurb: 'New to Fabric or data tools. Hints available.',
    stars: 1,
    palette: NPC_PALETTES.onelake,
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    blurb: 'You build reports or pipelines. Real trade-offs.',
    stars: 2,
    palette: PLAYER_PALETTE,
  },
  {
    id: 'expert',
    name: 'Expert',
    blurb: 'You run Fabric. Edge cases and hard limits.',
    stars: 3,
    palette: NPC_PALETTES.governance,
  },
];

const percent = (r: Result) =>
  r.max === 0 ? 0 : Math.round((r.score / r.max) * 100);

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const reduced = useReducedMotion();
  // Classic "press start": Enter begins the quest from anywhere on the title.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement))
        onStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <motion.div
      className="flex w-full max-w-3xl flex-col items-center text-center"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <PixelChip tone="gold">A Fabric App adventure</PixelChip>
      <PixelWindow className="mt-400 w-full px-600 py-500">
        <h1 className="font-pixel text-[clamp(44px,9vw,96px)] leading-[1] text-[#ffd23f] [text-shadow:4px_4px_0_#a8320a,8px_8px_0_#0b1224]">
          Fabric Quest
        </h1>
        <p className="mx-auto mt-400 max-w-xl text-500 leading-500 text-foreground/90">
          You are the new data lead at Aurora Outfitters. Explore the realm of
          Fabric, meet its keepers and tame the Data Chaos — one question at a
          time.
        </p>
        <PixelButton
          className="mt-600 px-700 py-300 text-500"
          onClick={onStart}
        >
          <span className="px-advance" aria-hidden>
            ▶
          </span>
          Start the quest
        </PixelButton>
        <p className="mt-300 font-pixel text-300 text-muted-foreground">
          Press <span className="text-foreground">Enter</span> to begin
        </p>
      </PixelWindow>
      <p className="mt-400 font-pixel text-300 text-[#f4f1e8]/70">
        WASD / arrows walk · Space talks and opens chests
      </p>
    </motion.div>
  );
}

export function DifficultyScreen({
  onPick,
}: {
  onPick: (d: Difficulty) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="w-full max-w-5xl">
      <div className="text-center">
        <PixelChip tone="gold">Choose your save slot</PixelChip>
        <h1 className="mt-300 font-pixel text-hero-900 leading-hero-900 text-[#f4f1e8] [text-shadow:3px_3px_0_#0b1224]">
          How well do you know your data?
        </h1>
        <p className="mt-200 text-400 text-[#f4f1e8]/80">
          Changing it later restarts the campaign.
        </p>
      </div>
      <div className="mt-600 grid gap-500 md:grid-cols-3">
        {DIFFICULTIES.map((d, i) => (
          <motion.button
            key={d.id}
            type="button"
            onClick={() => onPick(d.id)}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: i * 0.06 }}
            className="px-slot group text-left"
          >
            <PixelWindow className="h-full p-400">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-200 uppercase tracking-widest text-muted-foreground">
                  Slot {i + 1}
                </span>
                <span
                  className="font-pixel text-400 text-[#ffd23f]"
                  aria-label={`${d.stars} of 3 stars`}
                >
                  {'★'.repeat(d.stars)}
                  <span className="text-muted-foreground">
                    {'★'.repeat(3 - d.stars)}
                  </span>
                </span>
              </div>
              <div className="mt-300 flex items-center gap-400">
                <div className="px-inset grid size-[88px] shrink-0 place-items-center">
                  <PersonSprite palette={d.palette} label="" scale={4} />
                </div>
                <div>
                  <span className="block font-pixel text-hero-700 leading-hero-700 text-foreground">
                    {d.name}
                  </span>
                  <span className="mt-100 block font-pixel text-200 uppercase tracking-wider text-muted-foreground">
                    New game · Lv 1
                  </span>
                </div>
              </div>
              <span className="mt-300 block text-300 leading-300 text-foreground/85">
                {d.blurb}
              </span>
              <span className="px-slot-cta mt-400 inline-block font-pixel text-300 text-[#ffd23f]">
                ▶ Begin
              </span>
            </PixelWindow>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function SummaryScreen({
  chapters,
  game,
  onBack,
}: {
  chapters: Chapter[];
  game: GameState;
  onBack: () => void;
}) {
  const played = chapters.filter((c) => (game.results[c.id]?.max ?? 0) > 0);
  const score = played.reduce((s, c) => s + game.results[c.id]!.score, 0);
  const max = played.reduce((s, c) => s + game.results[c.id]!.max, 0);
  const p = percent({ score, max });
  const rank =
    p >= 85
      ? 'Fabric Architect'
      : p >= 60
        ? 'Data Lead'
        : p >= 30
          ? 'Data Explorer'
          : 'Fabric Rookie';

  return (
    <PixelWindow className="w-full max-w-3xl p-600">
      <div className="flex flex-wrap items-end gap-400">
        <div className="flex-1">
          <PixelChip tone="gold">Quest log</PixelChip>
          <h1 className="mt-300 font-pixel text-hero-900 leading-hero-900 text-[#ffd23f] [text-shadow:3px_3px_0_#0b1224]">
            {rank}
          </h1>
        </div>
        <p className="font-pixel text-400 text-muted-foreground">
          <span className="text-hero-800 text-foreground">{score}</span> / {max}
          <span className="ml-200 text-200 uppercase">{game.difficulty}</span>
        </p>
      </div>
      <p className="mt-200 text-400 text-foreground/80">
        {played.length} of {chapters.length} regions explored
      </p>
      <ul aria-label="Explored regions" className="mt-500 grid gap-300">
        {chapters.map((c) => {
          const r = game.results[c.id];
          const region = REGIONS.find((rg) => rg.id === c.id)!;
          const explored = (r?.max ?? 0) > 0;
          return (
            <li key={c.id} className="px-inset flex items-center gap-400 p-300">
              <span
                className="size-[14px] shrink-0"
                style={{
                  background: explored ? region.tint : 'transparent',
                  boxShadow: `inset 0 0 0 2px ${region.tint}`,
                }}
                aria-hidden
              />
              <span className="w-[38%] font-pixel text-300 leading-300 text-foreground">
                {region.name}
              </span>
              <div className="flex-1">
                <PixelBar
                  label={c.title}
                  value={explored ? percent(r!) : 0}
                  max={100}
                  color={region.tint}
                  showValue={false}
                  showLabel={false}
                />
              </div>
              <span className="w-[3.5rem] text-right font-pixel text-400 text-foreground">
                {explored ? `${percent(r!)}%` : '—'}
              </span>
            </li>
          );
        })}
      </ul>
      <PixelButton className="mt-600" onClick={onBack}>
        <span aria-hidden>◀</span> Back to the world
      </PixelButton>
    </PixelWindow>
  );
}
