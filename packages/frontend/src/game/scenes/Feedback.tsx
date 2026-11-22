import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { PixelButton } from '../rpg/ui/kit';

function sourceLink(source: string) {
  if (source.startsWith('https://')) return source;
  // Rayfin docs ship inside the app's node_modules; link to the public guide index instead.
  return null;
}

/** The battle message box shown after an answer. */
export function Feedback({
  message,
  correct,
  points,
  explanation,
  source,
  onContinue,
}: {
  /** The JRPG line, e.g. "Silo Slime takes 100 damage!". */
  message?: string;
  /** The answer itself was right; points may still be halved by a hint. */
  correct: boolean;
  points: number;
  explanation: string;
  source: string;
  onContinue: () => void;
}) {
  const partial = !correct && points > 0;
  const href = sourceLink(source);
  const next = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => next.current?.focus(), []);

  const verdict = correct ? 'Spot on!' : partial ? 'Partly right' : 'Not quite';
  const tone = correct
    ? 'text-success'
    : partial
      ? 'text-warning'
      : 'text-destructive';

  return (
    <motion.section
      role="status"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="px-inset mt-500 p-400"
    >
      {message && (
        <p className="font-pixel text-400 leading-400 text-foreground">
          {message}
        </p>
      )}
      <div className="mt-200 flex items-center gap-300">
        <p className={`font-pixel text-500 font-bold ${tone}`}>{verdict}</p>
        <span className="ml-auto font-pixel text-400 font-bold text-[#ffd23f]">
          +{points}
        </span>
      </div>
      <p className="mt-200 text-400 leading-400 text-foreground/90">
        {explanation}
      </p>
      <div className="mt-400 flex flex-wrap items-center gap-400">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-100 text-300 font-semibold text-primary underline-offset-4 hover:underline"
          >
            Learn more on Microsoft Learn{' '}
            <ExternalLink className="icon-size-200" aria-hidden />
          </a>
        ) : (
          <span className="text-300 text-muted-foreground">
            Source: Rayfin guide — {source.replace('rayfin-docs:', '')}
          </span>
        )}
        <PixelButton ref={next} className="ml-auto" onClick={onContinue}>
          Continue ▸
        </PixelButton>
      </div>
    </motion.section>
  );
}
