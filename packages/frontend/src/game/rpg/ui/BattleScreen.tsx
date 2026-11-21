import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, LogOut, Swords } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { ArrangeScene } from '../../scenes/ArrangeScene';
import { OptionList } from '../../scenes/ChoiceScene';
import { StoryChart } from '../../scenes/DashboardScene';
import { Feedback } from '../../scenes/Feedback';
import { MatchScene } from '../../scenes/MatchScene';
import type { Answer, Chapter } from '../../types';
import { Button } from '../../ui';
import {
  MAX_HP,
  answer,
  type AnswerOutcome,
  type Battle,
  type Campaign,
} from '../campaign';
import { PLAYER_PALETTE } from '../phaser/textures';
import { REGIONS } from '../world';
import { FoeSprite, PersonSprite } from './Sprite';

export type BattleEnd = AnswerOutcome['result'] | 'escaped';

const FOE_NAMES: Record<string, string> = {
  onelake: 'Silo Slime',
  ingest: 'Pipeline Gremlin',
  semantic: 'Measure Mimic',
  governance: 'Leaky Phantom',
  fabriciq: 'Context Chimera',
  apps: 'Limit Golem',
};

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-200 font-semibold uppercase tracking-wider text-white/70">
        <span>{label}</span>
        <span className="font-numeric">
          {value}/{max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="mt-100 h-300 overflow-hidden rounded-full bg-white/15"
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${max ? (value / max) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

/**
 * A turn-based fight: each question is an attack. Owns its own question loop on top of
 * the campaign rules and reports the final campaign when the fight ends.
 */
export function BattleScreen({
  chapter,
  campaign: initialCampaign,
  battle: initialBattle,
  onEnd,
}: {
  chapter: Chapter;
  campaign: Campaign;
  battle: Battle;
  onEnd: (campaign: Campaign, result: BattleEnd) => void;
}) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [battle, setBattle] = useState(initialBattle);
  const [outcome, setOutcome] = useState<
    (AnswerOutcome & { given: Answer }) | null
  >(null);
  const [hint, setHint] = useState(false);
  const [foeHp, setFoeHp] = useState(initialBattle.foeHp);
  const answeredIds = useRef(new Set<string>()); // guards double submits inside one render

  const q = battle.queue[0];
  const region = REGIONS.find((r) => r.id === chapter.id)!;
  const isBoss = battle.kind === 'boss';
  const foeName = isBoss
    ? `${FOE_NAMES[chapter.id]} King`
    : FOE_NAMES[chapter.id];

  function submit(a: Answer) {
    if (outcome || answeredIds.current.has(q.id)) return;
    answeredIds.current.add(q.id);
    const out = answer(campaign, battle, a, hint);
    setOutcome({ ...out, given: a });
    setCampaign(out.campaign);
    setFoeHp(Math.max(0, battle.foeHp - out.foeDamage));
  }

  function next() {
    if (!outcome) return;
    if (outcome.result === 'continue' && outcome.battle) {
      setBattle(outcome.battle);
      setFoeHp(outcome.battle.foeHp);
      setOutcome(null);
      setHint(false);
    } else onEnd(outcome.campaign, outcome.result);
  }

  const picked = outcome?.given.kind === 'choice' ? outcome.given.index : null;

  return (
    <motion.div
      className="absolute inset-0 z-20 overflow-y-auto bg-[#0d1424]/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Battle against ${foeName}`}
    >
      <div className="mx-auto max-w-4xl px-500 py-600">
        {/* Arena */}
        <div
          className="relative grid grid-cols-2 items-end gap-600 overflow-hidden rounded-4xl p-600"
          style={{
            background: `radial-gradient(circle at 70% 30%, ${region.tint}55, transparent 60%), linear-gradient(180deg, #1c2843, #0d1424)`,
          }}
        >
          <div className="flex flex-col items-start gap-300">
            <motion.div
              animate={
                outcome?.playerDamage ? { x: [0, -10, 10, -6, 0] } : { x: 0 }
              }
              transition={{ duration: 0.4 }}
            >
              <PersonSprite palette={PLAYER_PALETTE} label="You" />
            </motion.div>
            <Bar
              label="Your HP"
              value={campaign.hp}
              max={MAX_HP}
              color="#3ccf7f"
            />
          </div>
          <div className="flex flex-col items-end gap-300">
            <p className="font-heading text-500 font-black text-white">
              {foeName}
            </p>
            <motion.div
              animate={
                outcome && outcome.foeDamage > 0
                  ? {
                      x: [0, 12, -12, 8, 0],
                      opacity: foeHp === 0 ? 0.25 : 1,
                      scale: foeHp === 0 ? 0.8 : 1,
                    }
                  : { y: [0, -6, 0] }
              }
              transition={
                outcome ? { duration: 0.5 } : { duration: 2, repeat: Infinity }
              }
            >
              <FoeSprite
                kind={battle.kind}
                color={region.tint}
                label={foeName}
              />
            </motion.div>
            <Bar
              label="Foe HP"
              value={foeHp}
              max={battle.foeMax}
              color={region.tint}
            />
          </div>
          <AnimatePresence>
            {outcome && outcome.foeDamage > 0 && (
              <motion.span
                key={q.id}
                className="pointer-events-none absolute right-[22%] top-[20%] font-numeric text-hero-800 font-black text-[#ffd23f] drop-shadow"
                initial={{ y: 0, opacity: 1, scale: 0.6 }}
                animate={{ y: -50, opacity: 0, scale: 1.3 }}
                transition={{ duration: 1.1 }}
                aria-hidden
              >
                -{outcome.foeDamage}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Question card */}
        <motion.section
          key={q.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-500 rounded-4xl bg-background p-600 text-foreground shadow-2xl"
        >
          <div className="flex items-center gap-300 text-200 font-semibold uppercase tracking-widest text-muted-foreground">
            <Swords className="icon-size-200" aria-hidden />
            {isBoss
              ? `Boss attack · ${battle.queue.length} left`
              : 'A wild challenge appears'}
            {!isBoss && !outcome && (
              <Button
                variant="ghost"
                className="ml-auto px-300 py-200 text-300"
                onClick={() => onEnd(campaign, 'escaped')}
              >
                <LogOut className="icon-size-200" aria-hidden /> Run away
              </Button>
            )}
          </div>
          <h2 className="mt-200 font-heading text-hero-700 font-bold leading-hero-700">
            {q.prompt}
          </h2>

          {campaign.difficulty === 'beginner' && q.hint && !outcome && (
            <div className="mt-400">
              {hint ? (
                <p className="inline-flex items-center gap-200 rounded-2xl bg-warning/15 px-400 py-200 text-300">
                  <Lightbulb className="icon-size-300" aria-hidden /> {q.hint}
                </p>
              ) : (
                <Button variant="ghost" onClick={() => setHint(true)}>
                  <Lightbulb className="icon-size-300" aria-hidden /> Show hint
                  (half damage)
                </Button>
              )}
            </div>
          )}

          {q.kind === 'choice' && (
            <OptionList
              options={q.options}
              answer={q.answer}
              picked={picked}
              onPick={submit}
            />
          )}
          {q.kind === 'dashboard' && (
            <>
              <StoryChart chart={q.chart} />
              <OptionList
                options={q.options}
                answer={q.answer}
                picked={picked}
                onPick={submit}
              />
            </>
          )}
          {q.kind === 'arrange' && (
            <ArrangeScene
              key={q.id}
              scene={q}
              locked={!!outcome}
              onSubmit={submit}
            />
          )}
          {q.kind === 'match' && (
            <MatchScene
              key={q.id}
              scene={q}
              locked={!!outcome}
              onSubmit={submit}
            />
          )}

          {outcome && (
            <>
              {outcome.playerDamage > 0 && (
                <p
                  className={cn(
                    'mt-400 text-300 font-semibold text-destructive'
                  )}
                >
                  {foeName} hits back for {outcome.playerDamage} HP!
                </p>
              )}
              <Feedback
                correct={outcome.correct}
                points={outcome.points}
                explanation={q.explanation}
                source={q.source}
                onContinue={next}
              />
            </>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
