import { motion } from 'framer-motion';
import { ArrowRight, Check, Play, RotateCcw, Trophy } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Art } from '../art';
import type {
  Chapter,
  ChapterId,
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
          A Fabric App story
        </p>
        <h1 className="mt-300 font-heading text-hero-1000 font-black leading-[0.95] tracking-tight">
          Fabric Quest
        </h1>
        <p className="mt-500 max-w-md text-500 leading-500 text-muted-foreground">
          You are the new data lead at Aurora Outfitters. Six chapters, one data
          platform, and a company counting on you.
        </p>
        <Button className="mt-700 px-700 py-400 text-500" onClick={onStart}>
          <Play className="icon-size-400" aria-hidden /> Start the quest
        </Button>
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
        Pick a level. You can change it later — it restarts the campaign.
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

export function ChapterMap({
  chapters,
  game,
  onPlay,
  onSummary,
  onChangeDifficulty,
}: {
  chapters: Chapter[];
  game: GameState;
  onPlay: (id: ChapterId) => void;
  onSummary: () => void;
  onChangeDifficulty: () => void;
}) {
  const done = Object.keys(game.results).length;
  return (
    <div className="mx-auto max-w-6xl py-500">
      <header className="flex flex-wrap items-end gap-400">
        <div className="flex-1">
          <p className="font-heading text-300 font-bold uppercase tracking-[0.3em] text-primary">
            {game.difficulty} campaign · {done} / {chapters.length} chapters
          </p>
          <h1 className="mt-200 font-heading text-hero-900 font-black leading-hero-900">
            Aurora’s data journey
          </h1>
        </div>
        <Button variant="ghost" onClick={onChangeDifficulty}>
          Change difficulty
        </Button>
        {done > 0 && (
          <Button onClick={onSummary}>
            <Trophy className="icon-size-300" aria-hidden /> Summary
          </Button>
        )}
      </header>
      <ol
        aria-label="Chapters"
        className="mt-700 grid gap-500 sm:grid-cols-2 lg:grid-cols-3"
      >
        {chapters.map((c, i) => {
          const r = game.results[c.id];
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <button
                type="button"
                onClick={() => onPlay(c.id)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-4xl border-2 border-border bg-card text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                <div className="relative bg-muted">
                  <Art id={c.id} className="aspect-[16/10] w-full" still />
                  <span className="absolute left-400 top-400 grid size-800 place-items-center rounded-xl bg-card font-heading text-400 font-black shadow-sm">
                    {i + 1}
                  </span>
                  {r && (
                    <span className="absolute right-400 top-400 inline-flex items-center gap-100 rounded-full bg-success px-300 py-100 text-200 font-bold text-white">
                      <Check className="icon-size-200" aria-hidden />{' '}
                      {percent(r)}%
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-500">
                  <span className="font-heading text-500 font-bold leading-500">
                    {c.title}
                  </span>
                  <span className="mt-100 text-300 text-muted-foreground">
                    {c.tagline}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-100 pt-400 text-300 font-semibold text-primary">
                    {r ? 'Replay' : 'Play'}{' '}
                    <ArrowRight
                      className="icon-size-200 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </div>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export function ChapterResult({
  chapter,
  result,
  hasNext,
  onReplay,
  onNext,
  onMap,
}: {
  chapter: Chapter;
  result: Result;
  hasNext: boolean;
  onReplay: () => void;
  onNext: () => void;
  onMap: () => void;
}) {
  const p = percent(result);
  return (
    <div className="mx-auto max-w-2xl py-800 text-center">
      <Art id={chapter.id} className="mx-auto w-full max-w-md" />
      <p className="mt-600 font-heading text-300 font-bold uppercase tracking-[0.3em] text-primary">
        Chapter complete
      </p>
      <h1 className="mt-200 font-heading text-hero-900 font-black leading-hero-900">
        {chapter.title}
      </h1>
      <motion.p
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="mt-500 font-numeric text-hero-1000 font-black leading-hero-1000"
      >
        {result.score}
        <span className="text-hero-800 text-muted-foreground">
          {' '}
          / {result.max}
        </span>
      </motion.p>
      <p className="text-500 text-muted-foreground">
        {p >= 80
          ? 'Outstanding work.'
          : p >= 50
            ? 'Solid — a replay will make it shine.'
            : 'Every expert started here. Try again?'}
      </p>
      <div className="mt-700 flex flex-wrap justify-center gap-400">
        <Button variant="ghost" onClick={onReplay}>
          <RotateCcw className="icon-size-300" aria-hidden /> Replay
        </Button>
        <Button variant="ghost" onClick={onMap}>
          Back to map
        </Button>
        {hasNext && (
          <Button onClick={onNext}>
            Next chapter <ArrowRight className="icon-size-300" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

export function SummaryScreen({
  chapters,
  game,
  onMap,
}: {
  chapters: Chapter[];
  game: GameState;
  onMap: () => void;
}) {
  const played = chapters.filter((c) => game.results[c.id]);
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
        Your rank
      </p>
      <h1 className="mt-200 font-heading text-hero-1000 font-black leading-[1]">
        {rank}
      </h1>
      <p className="mt-300 text-500 text-muted-foreground">
        {score} of {max} points across {played.length} of {chapters.length}{' '}
        chapters · {game.difficulty}
      </p>
      <ul aria-label="Completed chapters" className="mt-700 grid gap-300">
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
      <Button className="mt-700" onClick={onMap}>
        Back to map
      </Button>
    </div>
  );
}
