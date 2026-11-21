import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Art } from '../art';
import type { DialogueScene as Scene } from '../types';
import { Button } from '../ui';

export function DialogueScene({
  scene,
  onContinue,
}: {
  scene: Scene;
  onContinue: () => void;
}) {
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus(), []);
  return (
    <div className="grid items-center gap-600 md:grid-cols-[1fr_1.1fr]">
      {scene.art && (
        <Art
          id={scene.art}
          className="w-full rounded-4xl bg-card/60 p-400 shadow-sm"
        />
      )}
      <div>
        <p className="font-heading text-300 font-bold uppercase tracking-widest text-primary">
          {scene.speaker}
        </p>
        <div className="mt-300 grid gap-300">
          {scene.lines.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.35 }}
              className="relative rounded-3xl rounded-tl-md bg-card px-500 py-400 text-500 leading-500 shadow-sm"
            >
              {line}
            </motion.p>
          ))}
        </div>
        <Button ref={next} className="mt-600" onClick={onContinue}>
          Continue <ArrowRight className="icon-size-300" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
