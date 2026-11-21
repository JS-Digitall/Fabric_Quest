import { motion } from 'framer-motion';
import { Map as MapIcon, Play } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Art } from '../art';
import type {
  Chapter,
  ChapterResult as Result,
  Difficulty,
  GameState,
} from '../types';
import { Button } from '../ui';

const DIFFICULTIES: { id: Difficulty; name: string; blurb: string }[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    blurb: 'New to Fabric or data tools. Hints available.',
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    blurb: 'You build reports or pipelines. Real trade-offs.',
  },
  {
    id: 'expert',
    name: 'Expert',
    blurb: 'You run Fabric. Edge cases and hard limits.',
  },
];

const percent = (r: Result) =>
  r.max === 0 ? 0 : Math.round((r.score / r.max) * 100);

export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-800 md:grid-cols-[1.1fr_1fr]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-heading text-300 font-bold uppercase tracking-[0.3em] text-primary">
          A Fabric App adventure
        </p>
        <h1 className="mt-300 font-heading text-hero-1000 font-black leading-[0.95] tracking-tight">
          Fabric Quest
        </h1>
        <p className="mt-500 max-w-md text-500 leading-500 text-muted-foreground">
          You are the new data lead at Aurora Outfitters. Explore the world of
          Fabric, meet its keepers and tame the Data Chaos — one question at a
          time.
        </p>
        <Button className="mt-700 px-700 py-400 text-500" onClick={onStart}>
          <Play className="icon-size-400" aria-hidden /> Start the quest
        </Button>
        <p className="mt-400 text-300 text-muted-foreground">
          Arrow keys or WASD to walk · Space to talk and open chests
        </p>
      </motion.div>
      <Art id="title" className="w-full" />
    </div>
  );
}

export function DifficultyScreen({
  onPick,
}: {
  onPick: (d: Difficulty) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl py-700">
      <h1 className="font-heading text-hero-900 font-black leading-hero-900">
        How well do you know your data?
      </h1>
      <p className="mt-300 text-500 text-muted-foreground">
        Pick a level. Changing it later restarts the campaign.
      </p>
      <div className="mt-700 grid gap-500 md:grid-cols-3">
        {DIFFICULTIES.map((d, i) => (
          <motion.button
            key={d.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            onClick={() => onPick(d.id)}
            className="group rounded-4xl border-2 border-border bg-card p-600 text-left shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <span className="flex gap-100" aria-hidden>
              {[0, 1, 2].map((n) => (
                <span
                  key={n}
                  className={cn(
                    'h-300 w-700 rounded-full',
                    n <= i ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </span>
            <span className="mt-500 block font-heading text-hero-700 font-bold">
              {d.name}
            </span>
            <span className="mt-200 block text-400 text-muted-foreground">
              {d.blurb}
            </span>
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
    <div className="mx-auto max-w-3xl py-700">
      <p className="font-heading text-300 font-bold uppercase tracking-[0.3em] text-primary">
        Your rank so far
      </p>
      <h1 className="mt-200 font-heading text-hero-1000 font-black leading-[1]">
        {rank}
      </h1>
      <p className="mt-300 text-500 text-muted-foreground">
        {score} of {max} points across {played.length} of {chapters.length}{' '}
        regions · {game.difficulty}
      </p>
      <ul aria-label="Explored regions" className="mt-700 grid gap-300">
        {played.map((c, i) => {
          const r = game.results[c.id]!;
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-400 rounded-3xl bg-card p-400 shadow-sm"
            >
              <span className="flex-1 font-heading text-400 font-bold">
                {c.title}
              </span>
              <span className="h-300 w-[30%] overflow-hidden rounded-full bg-muted">
                <motion.span
                  className="block h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent(r)}%` }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                />
              </span>
              <span className="w-[4.5rem] text-right font-numeric text-400 font-bold">
                {percent(r)}%
              </span>
            </motion.li>
          );
        })}
      </ul>
      <Button className="mt-700" onClick={onBack}>
        <MapIcon className="icon-size-300" aria-hidden /> Back to the world
      </Button>
    </div>
  );
}
