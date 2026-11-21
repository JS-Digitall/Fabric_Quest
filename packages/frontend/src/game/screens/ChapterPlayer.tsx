import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { maxScore, scenesFor, scoreAnswer } from '../engine';
import { ArrangeScene } from '../scenes/ArrangeScene';
import { OptionList } from '../scenes/ChoiceScene';
import { StoryChart } from '../scenes/DashboardScene';
import { DialogueScene } from '../scenes/DialogueScene';
import { Feedback } from '../scenes/Feedback';
import { MatchScene } from '../scenes/MatchScene';
import type { Answer, Chapter, Difficulty } from '../types';
import { Button } from '../ui';

export function ChapterPlayer({
  chapter,
  difficulty,
  onFinish,
  onExit,
}: {
  chapter: Chapter;
  difficulty: Difficulty;
  onFinish: (score: number, max: number) => void;
  onExit: () => void;
}) {
  const scenes = useMemo(() => scenesFor(chapter, difficulty), [chapter, difficulty]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<{ points: number; answer: Answer } | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const score = useRef(0);
  const answered = useRef(new Set<string>()); // guards double submits within one render

  const scene = scenes[index];
  const isLast = index === scenes.length - 1;

  function next() {
    if (isLast) return onFinish(score.current, maxScore(scenes));
    setIndex(index + 1);
    setResult(null);
    setHintShown(false);
  }

  function submit(answer: Answer) {
    if (scene.kind === 'dialogue' || answered.current.has(scene.id)) return;
    answered.current.add(scene.id);
    const points = scoreAnswer(scene, answer, hintShown);
    score.current += points;
    setResult({ points, answer });
  }

  const questionCount = scenes.filter((s) => s.kind !== 'dialogue').length;
  const questionNo = scenes.slice(0, index + 1).filter((s) => s.kind !== 'dialogue').length;
  const picked = result?.answer.kind === 'choice' ? result.answer.index : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-600 flex items-center gap-400">
        <Button variant="ghost" aria-label="Back to map" className="px-300" onClick={onExit}>
          <X className="size-icon-300" aria-hidden />
        </Button>
        <div className="flex-1">
          <p className="text-200 font-semibold uppercase tracking-widest text-muted-foreground">{chapter.title}</p>
          <div
            className="mt-100 h-200 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Chapter progress"
            aria-valuemin={0}
            aria-valuemax={scenes.length}
            aria-valuenow={index + 1}
          >
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${((index + (result ? 1 : 0)) / scenes.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="rounded-full bg-card px-400 py-200 font-numeric text-400 font-bold shadow-sm">
          {score.current} pts
        </span>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={scene.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          {scene.kind === 'dialogue' ? (
            <DialogueScene scene={scene} onContinue={next} />
          ) : (
            <>
              <p className="text-200 font-semibold uppercase tracking-widest text-muted-foreground">
                Challenge {questionNo} of {questionCount}
              </p>
              <h2 className="mt-200 font-heading text-hero-700 font-bold leading-hero-700">{scene.prompt}</h2>

              {difficulty === 'beginner' && scene.hint && !result && (
                <div className="mt-400">
                  {hintShown ? (
                    <p className="inline-flex items-center gap-200 rounded-2xl bg-warning/15 px-400 py-200 text-300">
                      <Lightbulb className="size-icon-300" aria-hidden /> {scene.hint}
                    </p>
                  ) : (
                    <Button variant="ghost" onClick={() => setHintShown(true)}>
                      <Lightbulb className="size-icon-300" aria-hidden /> Show hint (half points)
                    </Button>
                  )}
                </div>
              )}

              {scene.kind === 'choice' && (
                <OptionList options={scene.options} answer={scene.answer} picked={picked} onPick={submit} />
              )}
              {scene.kind === 'dashboard' && (
                <>
                  <StoryChart chart={scene.chart} />
                  <OptionList options={scene.options} answer={scene.answer} picked={picked} onPick={submit} />
                </>
              )}
              {scene.kind === 'arrange' && <ArrangeScene scene={scene} locked={!!result} onSubmit={submit} />}
              {scene.kind === 'match' && <MatchScene scene={scene} locked={!!result} onSubmit={submit} />}

              {result && (
                <Feedback
                  points={result.points}
                  explanation={scene.explanation}
                  source={scene.source}
                  onContinue={next}
                />
              )}
            </>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
