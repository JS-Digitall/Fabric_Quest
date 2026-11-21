import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { Answer } from '../types';

/** Shared by choice and dashboard scenes. */
export function OptionList({
  options,
  answer,
  picked,
  onPick,
}: {
  options: string[];
  answer: number;
  picked: number | null;
  onPick: (a: Answer) => void;
}) {
  const locked = picked !== null;
  return (
    <ul className="mt-500 grid gap-300">
      {options.map((option, i) => {
        const correct = locked && i === answer;
        const wrong = locked && i === picked && i !== answer;
        return (
          <motion.li
            key={option}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              type="button"
              disabled={locked}
              onClick={() => onPick({ kind: 'choice', index: i })}
              className={cn(
                'flex w-full items-center gap-300 rounded-2xl border-2 border-border bg-card px-500 py-400 text-left text-400 font-medium transition-all hover:-translate-y-0.5 hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:hover:translate-y-0',
                correct && 'border-success bg-success/10',
                wrong && 'border-destructive bg-destructive/10',
                locked && !correct && !wrong && 'opacity-60'
              )}
            >
              <span aria-hidden className="grid size-800 shrink-0 place-items-center rounded-xl bg-muted font-heading text-300 font-bold">
                {correct ? <Check className="size-icon-300" aria-hidden /> : wrong ? <X className="size-icon-300" aria-hidden /> : String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
