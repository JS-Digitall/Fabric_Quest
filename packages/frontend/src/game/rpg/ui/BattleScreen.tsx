import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Lightbulb, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ArrangeScene } from '../../scenes/ArrangeScene';
import { StoryChart } from '../../scenes/DashboardScene';
import { Feedback } from '../../scenes/Feedback';
import { MatchScene } from '../../scenes/MatchScene';
import type { Answer, Chapter } from '../../types';
import {
  MAX_HP,
  answer,
  type AnswerOutcome,
  type Battle,
  type Campaign,
} from '../campaign';
import { PLAYER_PALETTE } from '../phaser/textures';
import { REGIONS } from '../world';
import {
  CommandList,
  PixelBar,
  PixelButton,
  PixelChip,
  PixelWindow,
} from './kit';
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

const EASE = [0.23, 1, 0.32, 1] as const;

/** The line a JRPG would print after an attack. */
function battleMessage(foe: string, o: AnswerOutcome) {
  const hit =
    o.points > 0 ? `${foe} takes ${o.points} damage!` : `${foe} dodges!`;
  return o.playerDamage > 0
    ? `${hit} ${foe} hits back for ${o.playerDamage} HP!`
    : hit;
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
  onAnswered,
}: {
  chapter: Chapter;
  campaign: Campaign;
  battle: Battle;
  onEnd: (campaign: Campaign, result: BattleEnd) => void;
  onAnswered?: (correct: boolean) => void;
}) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [battle, setBattle] = useState(initialBattle);
  const [outcome, setOutcome] = useState<
    (AnswerOutcome & { given: Answer }) | null
  >(null);
  const [hint, setHint] = useState(false);
  const [foeHp, setFoeHp] = useState(initialBattle.foeHp);
  const answeredIds = useRef(new Set<string>()); // guards double submits inside one render
  const reduced = useReducedMotion();
  const command = useRef<HTMLElement>(null);

  const q = battle.queue[0];
  // Keyboard players land on the first answer of every question (cards share .px-option).
  useEffect(() => {
    command.current
      ?.querySelector<HTMLElement>('.px-option:not(:disabled)')
      ?.focus();
  }, [q.id]);
  const region = REGIONS.find((r) => r.id === chapter.id)!;
  const isBoss = battle.kind === 'boss';
  const foeName = isBoss
    ? `${FOE_NAMES[chapter.id]} King`
    : FOE_NAMES[chapter.id];
  const foeDown = outcome !== null && foeHp === 0;

  function submit(a: Answer) {
    if (outcome || answeredIds.current.has(q.id)) return;
    answeredIds.current.add(q.id);
    const out = answer(campaign, battle, a, hint);
    setOutcome({ ...out, given: a });
    setCampaign(out.campaign);
    setFoeHp(
      out.result === 'won' ? 0 : Math.max(0, battle.foeHp - out.foeDamage)
    );
    onAnswered?.(out.correct);
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
  const shake = (amount: number) =>
    reduced ? {} : { x: [0, amount, -amount, amount / 2, 0] };

  return (
    <motion.div
      className="absolute inset-0 z-20 overflow-y-auto bg-[#070c18]/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Battle against ${foeName}`}
    >
      <div className="mx-auto grid max-w-6xl items-start gap-500 px-500 py-600 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Stage */}
        <PixelWindow className="px-stage-enter overflow-hidden lg:sticky lg:top-600">
          <motion.div
            className="relative h-[230px] overflow-hidden"
            animate={outcome?.playerDamage ? shake(8) : {}}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
              background: `radial-gradient(120% 80% at 70% 10%, ${region.tint}66, transparent 60%), linear-gradient(180deg, #1d2c55 0%, #142243 60%, #0f1a36 100%)`,
            }}
          >
            {/* Twinkling sky dots and the pixel ground strip. */}
            <div className="px-stage-stars absolute inset-0" aria-hidden />
            <div
              className="absolute inset-x-0 bottom-0 h-[62px]"
              aria-hidden
              style={{
                background: `repeating-linear-gradient(90deg, ${region.tint}33 0 8px, ${region.tint}22 8px 16px), linear-gradient(180deg, ${region.tint}55, ${region.tint}22)`,
                boxShadow: `inset 0 4px 0 ${region.tint}99`,
              }}
            />

            {/* Player */}
            <div className="absolute bottom-[34px] left-[12%] flex flex-col items-center">
              <PersonSprite palette={PLAYER_PALETTE} label="You" scale={5} />
              <span
                className="-mt-200 h-[8px] w-[64px] rounded-[50%] bg-black/40"
                aria-hidden
              />
            </div>

            {/* Foe */}
            <div className="absolute bottom-[34px] right-[10%] flex flex-col items-center">
              <motion.div
                initial={reduced ? false : { y: -60, opacity: 0 }}
                animate={
                  foeDown
                    ? { y: 0, opacity: 0.2, filter: 'brightness(3)' }
                    : outcome && outcome.foeDamage > 0
                      ? {
                          y: 0,
                          opacity: 1,
                          filter: [
                            'brightness(1)',
                            'brightness(3)',
                            'brightness(1)',
                          ],
                          ...shake(10),
                        }
                      : { y: reduced ? 0 : [0, -5, 0], opacity: 1 }
                }
                transition={
                  outcome
                    ? { duration: 0.32, ease: EASE }
                    : {
                        y: reduced
                          ? { duration: 0 }
                          : {
                              duration: 2.2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: 0.4,
                            },
                        opacity: { duration: 0.2 },
                      }
                }
              >
                <FoeSprite
                  kind={battle.kind}
                  color={region.tint}
                  label={foeName}
                />
              </motion.div>
              <span
                className="-mt-100 h-[10px] w-[96px] rounded-[50%] bg-black/40"
                aria-hidden
              />
            </div>

            <div className="absolute right-300 top-300">
              <PixelChip tone="gold">{foeName}</PixelChip>
            </div>

            <AnimatePresence>
              {outcome && outcome.foeDamage > 0 && (
                <motion.span
                  key={q.id}
                  className="pointer-events-none absolute right-[16%] top-[28%] font-pixel text-hero-800 font-bold text-[#ffd23f] [text-shadow:3px_3px_0_#0b1224]"
                  initial={{ y: 8, opacity: 0, scale: 0.9 }}
                  animate={{ y: -36, opacity: [0, 1, 1, 0], scale: 1 }}
                  transition={{ duration: 0.9, ease: EASE }}
                  aria-hidden
                >
                  -{outcome.foeDamage}
                </motion.span>
              )}
              {outcome && outcome.playerDamage > 0 && (
                <motion.span
                  key={`${q.id}-hurt`}
                  className="pointer-events-none absolute inset-0 bg-[#ff3b3b]"
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  aria-hidden
                />
              )}
            </AnimatePresence>
          </motion.div>
          <div className="grid grid-cols-2 gap-500 bg-[#0b1224] px-400 pb-400 pt-300">
            <PixelBar
              label="Your HP"
              value={campaign.hp}
              max={MAX_HP}
              color="#4fe08f"
            />
            <PixelBar
              label="Foe HP"
              value={foeHp}
              max={battle.foeMax}
              color={region.tint}
            />
          </div>
        </PixelWindow>

        {/* Command window */}
        <PixelWindow className="p-500">
          <motion.section
            key={q.id}
            ref={command}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <div className="flex items-center gap-300">
              <PixelChip tone={isBoss ? 'gold' : 'muted'}>
                {isBoss
                  ? `Boss attack · ${battle.queue.length} left`
                  : 'A wild challenge appears'}
              </PixelChip>
              {!isBoss && !outcome && (
                <PixelButton
                  variant="ghost"
                  className="ml-auto px-300 py-100 text-300"
                  onClick={() => onEnd(campaign, 'escaped')}
                >
                  <LogOut className="icon-size-200" aria-hidden /> Run away
                </PixelButton>
              )}
            </div>
            <h2 className="mt-300 text-500 font-semibold leading-500 text-foreground">
              {q.prompt}
            </h2>

            {campaign.difficulty === 'beginner' && q.hint && !outcome && (
              <div className="mt-300">
                {hint ? (
                  <p className="inline-flex items-center gap-200 bg-[#ffd23f]/12 px-300 py-200 text-300 text-[#ffe08a] [box-shadow:inset_0_0_0_2px_#ffd23f55]">
                    <Lightbulb className="icon-size-300" aria-hidden /> {q.hint}
                  </p>
                ) : (
                  <PixelButton
                    variant="ghost"
                    className="py-100 text-300"
                    onClick={() => setHint(true)}
                  >
                    <Lightbulb className="icon-size-200" aria-hidden /> Show
                    hint (half damage)
                  </PixelButton>
                )}
              </div>
            )}

            {(q.kind === 'choice' || q.kind === 'dashboard') && (
              <>
                {q.kind === 'dashboard' && <StoryChart chart={q.chart} />}
                <CommandList
                  label="Your attack"
                  options={q.options}
                  picked={picked}
                  answer={outcome ? q.answer : null}
                  onPick={(index) => submit({ kind: 'choice', index })}
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
              <Feedback
                message={battleMessage(foeName, outcome)}
                correct={outcome.correct}
                points={outcome.points}
                explanation={q.explanation}
                source={q.source}
                onContinue={next}
              />
            )}
          </motion.section>
        </PixelWindow>
      </div>
    </motion.div>
  );
}
