import { motion } from 'framer-motion';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import type { Answer, MatchScene as Scene } from '../types';
import { PixelButton } from '../rpg/ui/kit';
import { shuffled } from './shuffle';

// Pair colours: each made pair gets its own hue so the link is visible without lines.
const HUES = [
  'var(--color-pair-1)',
  'var(--color-pair-2)',
  'var(--color-pair-3)',
  'var(--color-pair-4)',
  'var(--color-pair-5)',
];

export function MatchScene({
  scene,
  locked,
  onSubmit,
}: {
  scene: Scene;
  locked: boolean;
  onSubmit: (a: Answer) => void;
}) {
  const lefts = scene.pairs.map((p) => p[0]);
  const [rights] = useState(() => shuffled(scene.pairs.map((p) => p[1])));
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const pairOf = (side: 0 | 1, v: string) =>
    pairs.findIndex((p) => p[side] === v);
  const correct = new Map(scene.pairs);

  function pickLeft(l: string) {
    if (locked) return;
    const at = pairOf(0, l);
    if (at >= 0) setPairs(pairs.filter((_, i) => i !== at)); // unpair
    setSelected(selected === l ? null : l);
  }

  function pickRight(r: string) {
    if (locked || !selected) return;
    setPairs([
      ...pairs.filter((p) => p[0] !== selected && p[1] !== r),
      [selected, r],
    ]);
    setSelected(null);
  }

  const chip = (side: 0 | 1, v: string) => {
    const at = pairOf(side, v);
    const hue = at >= 0 ? HUES[at % HUES.length] : undefined;
    const isSelected = side === 0 && selected === v;
    const right =
      locked && at >= 0 && correct.get(pairs[at][0]) === pairs[at][1];
    return (
      <motion.button
        layout
        type="button"
        key={v}
        disabled={locked || (side === 1 && !selected)}
        onClick={() => (side === 0 ? pickLeft(v) : pickRight(v))}
        aria-pressed={isSelected}
        // Pair colour as a frame plus a left bar; once locked, right/wrong colours take over.
        style={
          hue && !locked
            ? { boxShadow: `inset 0 0 0 2px ${hue}, inset 8px 0 0 ${hue}` }
            : undefined
        }
        data-state={locked && at >= 0 ? (right ? 'right' : 'wrong') : undefined}
        className={cn(
          'px-option block py-200 text-300',
          side === 0 && 'font-semibold',
          isSelected && 'px-option-selected'
        )}
      >
        {v}
        {at >= 0 && <span className="sr-only"> (pair {at + 1})</span>}
        {side === 0 && locked && !right && (
          <span className="mt-100 block text-300 font-semibold text-success">
            → {correct.get(v)}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <div className="mt-500">
      <p className="mb-300 text-300 text-muted-foreground">
        Pick a term on the left, then its partner on the right.
      </p>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-400 gap-y-200">
        <div className="grid content-start gap-200">
          {lefts.map((l) => chip(0, l))}
        </div>
        <div className="grid content-start gap-200">
          {rights.map((r) => chip(1, r))}
        </div>
      </div>
      {!locked && (
        <PixelButton
          className="mt-400"
          disabled={pairs.length < scene.pairs.length}
          onClick={() => onSubmit({ kind: 'pairs', pairs })}
        >
          Check matches
        </PixelButton>
      )}
    </div>
  );
}
