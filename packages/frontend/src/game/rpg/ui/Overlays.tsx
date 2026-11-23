import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Heart } from 'lucide-react';

import { isLearnLink } from '../../scenes/source';
import { useEffect, useRef, useState } from 'react';

import type { Chapter, DialogueScene } from '../../types';
import { NPC_PALETTES, PLAYER_PALETTE } from '../phaser/textures';
import type { Region } from '../world';
import { PixelButton, PixelChip, PixelWindow } from './kit';
import { PersonSprite } from './Sprite';

const EASE = [0.23, 1, 0.32, 1] as const;

/** Classic RPG text box: portrait, name plate, typed line, ▼ to advance. */
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
  const reduced = useReducedMotion();
  const palette =
    scene.speaker === 'You' ? PLAYER_PALETTE : NPC_PALETTES[region.id];
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${scene.speaker} says`}
      className="absolute inset-x-0 bottom-0 z-20 p-500"
      initial={reduced ? { opacity: 0 } : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 12, opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.24, ease: EASE }}
    >
      <div className="relative mx-auto max-w-4xl">
        {/* Name plate sits on the window's top edge, like a JRPG speaker tab. */}
        <div className="absolute -top-[22px] left-[148px] z-10">
          <PixelChip tone="gold">{scene.speaker}</PixelChip>
        </div>
        <PixelWindow className="flex items-end gap-500 p-400">
          <div
            className="px-inset shrink-0 p-200"
            style={{ background: `${region.tint}33` }}
          >
            <PersonSprite palette={palette} label={scene.speaker} />
          </div>
          {/* Keyed per line so each line starts typing from scratch. */}
          <TypedLine
            key={line}
            text={scene.lines[line]}
            last={line === scene.lines.length - 1}
            onNext={() =>
              line < scene.lines.length - 1 ? setLine(line + 1) : onClose()
            }
          />
        </PixelWindow>
      </div>
    </motion.div>
  );
}

function TypedLine({
  text,
  last,
  onNext,
}: {
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
      <p
        className="min-h-[6.5rem] flex-1 self-start pt-200 text-500 leading-500 text-foreground"
        aria-live="polite"
      >
        {text.slice(0, shown)}
        <span className="sr-only">{text.slice(shown)}</span>
        {done && (
          <span className="px-advance ml-200 text-primary" aria-hidden>
            ▼
          </span>
        )}
      </p>
      <PixelButton
        ref={next}
        onClick={() => (done ? onNext() : setShown(text.length))}
        className="shrink-0"
      >
        {done && last ? 'Close' : 'Next'}
      </PixelButton>
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
  const reduced = useReducedMotion();
  useEffect(() => close.current?.focus(), []);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Treasure chest"
      className="absolute inset-0 z-20 grid place-items-center bg-[#070c18]/60 p-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={reduced ? false : { scale: 0.94, y: 8, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
      >
        <PixelWindow tone="parchment" className="relative p-500">
          {/* Wax seal */}
          <span
            className="absolute -right-300 -top-300 grid size-[44px] place-items-center rounded-full bg-[#a8322a] font-pixel text-400 text-[#ffe9d6] shadow-[inset_0_-3px_0_#6e1a14,0_2px_0_#0003]"
            aria-hidden
          >
            ✦
          </span>
          <p className="font-pixel text-300 uppercase tracking-widest text-primary">
            Codex page found
          </p>
          <h2 className="mt-200 font-pixel text-hero-700 leading-hero-700 text-foreground">
            {chapter.title}
          </h2>
          <p className="mt-200 text-400 text-muted-foreground">
            {chapter.tagline}
          </p>
          <p className="mt-400 inline-flex items-center gap-200 font-pixel text-400 text-success">
            <Heart className="icon-size-300" aria-hidden />{' '}
            {healed > 0 ? `+${healed} HP restored` : 'HP already full'}
          </p>
          <div className="mt-500 flex items-center gap-400">
            {source.startsWith('https://') && (
              <a
                href={source}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-100 text-300 font-semibold text-primary underline-offset-4 hover:underline"
              >
                {isLearnLink(source) ? 'Read up on Microsoft Learn' : 'Read the source'}{' '}
                <ExternalLink className="icon-size-200" aria-hidden />
              </a>
            )}
            <PixelButton ref={close} className="ml-auto" onClick={onClose}>
              Close
            </PixelButton>
          </div>
        </PixelWindow>
      </motion.div>
    </motion.div>
  );
}

export function RegionBanner({ region }: { region: Region }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={region.id}
      className="pointer-events-none absolute inset-x-0 top-[16%] z-10 flex justify-center"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: EASE }}
      aria-live="polite"
    >
      <div className="px-ribbon" style={{ ['--tint' as string]: region.tint }}>
        <p className="font-pixel text-200 uppercase tracking-[0.3em] text-[#f4f1e8]/80">
          Now entering
        </p>
        <p className="font-pixel text-hero-800 leading-hero-800 text-[#f4f1e8] [text-shadow:3px_3px_0_#0b1224]">
          {region.name}
        </p>
      </div>
    </motion.div>
  );
}

export function Toast({ text }: { text: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      role="status"
      className="pointer-events-none absolute inset-x-0 top-[30%] z-10 flex justify-center"
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      <PixelWindow className="px-500 py-300">
        <p className="font-pixel text-500 text-foreground">{text}</p>
      </PixelWindow>
    </motion.div>
  );
}
