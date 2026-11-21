import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Heart, ScrollText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Chapter, DialogueScene } from '../../types';
import { Button } from '../../ui';
import { NPC_PALETTES, PLAYER_PALETTE } from '../phaser/textures';
import type { Region } from '../world';
import { PersonSprite } from './Sprite';

/** Classic RPG text box: one line at a time, typed out, Space/Enter/click to advance. */
export function DialogueBox({
  scene,
  region,
  onClose,
}: {
  scene: DialogueScene;
  region: Region;
  onClose: () => void;
}) {
  const [line, setLine] = useState(0);
  const palette =
    scene.speaker === 'You' ? PLAYER_PALETTE : NPC_PALETTES[region.id];
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${scene.speaker} says`}
      className="absolute inset-x-0 bottom-0 z-20 p-500"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
    >
      <div className="mx-auto flex max-w-4xl items-end gap-500 rounded-4xl border-4 border-white/80 bg-[#14213d]/95 p-500 text-white shadow-2xl">
        <div
          className="shrink-0 rounded-3xl p-200"
          style={{ background: `${region.tint}44` }}
        >
          <PersonSprite palette={palette} label={scene.speaker} />
        </div>
        {/* Keyed per line so each line starts typing from scratch. */}
        <TypedLine
          key={line}
          speaker={scene.speaker}
          tint={region.tint}
          text={scene.lines[line]}
          last={line === scene.lines.length - 1}
          onNext={() =>
            line < scene.lines.length - 1 ? setLine(line + 1) : onClose()
          }
        />
      </div>
    </motion.div>
  );
}

function TypedLine({
  speaker,
  tint,
  text,
  last,
  onNext,
}: {
  speaker: string;
  tint: string;
  text: string;
  last: boolean;
  onNext: () => void;
}) {
  const [shown, setShown] = useState(() =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? text.length
      : 0
  );
  const done = shown >= text.length;
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setInterval(
      () => setShown((s) => Math.min(text.length, s + 2)),
      18
    );
    return () => clearInterval(t);
  }, [text]);
  useEffect(() => next.current?.focus(), []);

  return (
    <>
      <div className="min-h-[7rem] flex-1">
        <p
          className="font-heading text-300 font-bold uppercase tracking-widest"
          style={{ color: tint }}
        >
          {speaker}
        </p>
        <p className="mt-200 text-500 leading-500" aria-live="polite">
          {text.slice(0, shown)}
          <span className="sr-only">{text.slice(shown)}</span>
        </p>
      </div>
      <Button
        ref={next}
        onClick={() => (done ? onNext() : setShown(text.length))}
        className="shrink-0"
      >
        {done && last ? 'Close' : 'Next'}{' '}
        <ArrowRight className="icon-size-300" aria-hidden />
      </Button>
    </>
  );
}

/** A chest restores HP and hands over a codex page for the region — never an answer. */
export function ChestCard({
  chapter,
  source,
  healed,
  onClose,
}: {
  chapter: Chapter;
  source: string;
  healed: number;
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => close.current?.focus(), []);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Treasure chest"
      className="absolute inset-0 z-20 grid place-items-center bg-[#0d1424]/60 p-500 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="rpg-panel w-full max-w-md p-600"
        initial={{ scale: 0.7, rotate: -4 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
      >
        <p className="flex items-center gap-200 font-heading text-300 font-bold uppercase tracking-widest text-primary">
          <ScrollText className="icon-size-300" aria-hidden /> Codex page found
        </p>
        <h2 className="mt-200 font-heading text-hero-700 font-black leading-hero-700">
          {chapter.title}
        </h2>
        <p className="mt-200 text-400 text-muted-foreground">
          {chapter.tagline}
        </p>
        <p className="mt-400 inline-flex items-center gap-200 rounded-2xl bg-success/15 px-400 py-200 font-semibold text-success">
          <Heart className="icon-size-300" aria-hidden /> +{healed} HP restored
        </p>
        <div className="mt-500 flex items-center gap-400">
          {source.startsWith('https://') && (
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-100 text-300 font-semibold text-primary underline-offset-4 hover:underline"
            >
              Read up on Microsoft Learn{' '}
              <ExternalLink className="icon-size-200" aria-hidden />
            </a>
          )}
          <Button ref={close} className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function RegionBanner({ region }: { region: Region }) {
  return (
    <motion.div
      key={region.id}
      className="pointer-events-none absolute inset-x-0 top-[18%] z-10 text-center"
      initial={{ opacity: 0, y: -16, letterSpacing: '0.6em' }}
      animate={{ opacity: 1, y: 0, letterSpacing: '0.2em' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      aria-live="polite"
    >
      <p className="font-heading text-300 font-bold uppercase text-white/80 drop-shadow">
        Now entering
      </p>
      <p
        className="font-heading text-hero-900 font-black uppercase text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]"
        style={{ color: region.tint }}
      >
        {region.name}
      </p>
    </motion.div>
  );
}

export function Toast({ text }: { text: string }) {
  return (
    <motion.p
      role="status"
      className="pointer-events-none absolute inset-x-0 top-[30%] z-10 mx-auto w-fit rounded-3xl bg-[#14213d]/90 px-600 py-400 text-center font-heading text-500 font-bold text-white shadow-2xl"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {text}
    </motion.p>
  );
}
