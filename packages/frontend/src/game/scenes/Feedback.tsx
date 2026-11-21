import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '../ui';

function sourceLink(source: string) {
  if (source.startsWith('https://')) return source;
  // Rayfin docs ship inside the app's node_modules; link to the public guide index instead.
  return null;
}

export function Feedback({
  points,
  explanation,
  source,
  onContinue,
}: {
  points: number;
  explanation: string;
  source: string;
  onContinue: () => void;
}) {
  const good = points >= 100;
  const partial = points > 0 && !good;
  const href = sourceLink(source);
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus(), []);

  return (
    <motion.section
      role="status"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-600 rounded-3xl border-2 border-border bg-card p-600"
    >
      <div className="flex items-center gap-300">
        {good || partial ? (
          <CheckCircle2 className="icon-size-500 text-success" aria-hidden />
        ) : (
          <XCircle className="icon-size-500 text-destructive" aria-hidden />
        )}
        <p className="font-heading text-500 font-bold">
          {good ? 'Spot on!' : partial ? 'Partly right' : 'Not quite'}
        </p>
        <span className="ml-auto rounded-full bg-muted px-300 py-100 font-numeric text-400 font-bold">
          +{points}
        </span>
      </div>
      <p className="mt-300 text-400 leading-400 text-foreground">
        {explanation}
      </p>
      <div className="mt-500 flex flex-wrap items-center gap-400">
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
        <Button ref={next} className="ml-auto" onClick={onContinue}>
          Continue <ArrowRight className="icon-size-300" aria-hidden />
        </Button>
      </div>
    </motion.section>
  );
}
