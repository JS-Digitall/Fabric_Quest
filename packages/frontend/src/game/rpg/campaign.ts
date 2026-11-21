import { REGIONS, creatureSpots, type Spot } from './world';
import { scenesFor, scoreAnswer } from '../engine';
import type {
  Answer,
  Chapter,
  ChapterId,
  ChapterResult,
  ChoiceScene,
  Difficulty,
  QuestionScene,
} from '../types';

export type RegionId = ChapterId;

/** Creatures ask choice questions; the boss asks the puzzles and charts. */
export interface RegionPool {
  choice: ChoiceScene[];
  boss: QuestionScene[];
}

export function poolFor(chapter: Chapter, d: Difficulty): RegionPool {
  const scenes = scenesFor(chapter, d);
  return {
    choice: scenes.filter((s): s is ChoiceScene => s.kind === 'choice'),
    boss: scenes.filter(
      (s): s is QuestionScene =>
        s.kind === 'arrange' || s.kind === 'match' || s.kind === 'dashboard'
    ),
  };
}

export interface Campaign {
  difficulty: Difficulty;
  hp: number;
  /** sceneId -> points scored; every question is asked once per campaign. */
  answered: Record<string, number>;
  defeatedCreatures: string[];
  bossesDefeated: RegionId[];
  openedChests: string[];
}

export const MAX_HP = 100;
export const CREATURE_HIT = 20;

export function newCampaign(difficulty: Difficulty): Campaign {
  return {
    difficulty,
    hp: MAX_HP,
    answered: {},
    defeatedCreatures: [],
    bossesDefeated: [],
    openedChests: [],
  };
}

export type Battle =
  | {
      kind: 'creature';
      region: RegionId;
      creatureId: string;
      queue: QuestionScene[];
      foeHp: number;
      foeMax: number;
    }
  | {
      kind: 'boss';
      region: RegionId;
      queue: QuestionScene[];
      foeHp: number;
      foeMax: number;
    };

const unanswered = (c: Campaign) => (q: QuestionScene) => !(q.id in c.answered);

export function startCreatureBattle(
  c: Campaign,
  chapter: Chapter,
  creatureId: string
): Battle | null {
  const q = poolFor(chapter, c.difficulty).choice.find(unanswered(c));
  if (!q) return null;
  return {
    kind: 'creature',
    region: chapter.id,
    creatureId,
    queue: [q],
    foeHp: 100,
    foeMax: 100,
  };
}

export function startBossBattle(c: Campaign, chapter: Chapter): Battle | null {
  if (c.bossesDefeated.includes(chapter.id)) return null;
  const queue = poolFor(chapter, c.difficulty).boss.filter(unanswered(c));
  if (queue.length === 0) return null;
  const hp = queue.length * 100;
  return { kind: 'boss', region: chapter.id, queue, foeHp: hp, foeMax: hp };
}

export interface AnswerOutcome {
  campaign: Campaign;
  battle: Battle | null;
  points: number;
  correct: boolean;
  foeDamage: number;
  playerDamage: number;
  result: 'continue' | 'won' | 'fled' | 'lost';
}

export function answer(
  c: Campaign,
  b: Battle,
  a: Answer,
  usedHint: boolean
): AnswerOutcome {
  const q = b.queue[0];
  if (!q || q.id in c.answered) {
    return {
      campaign: c,
      battle: b,
      points: 0,
      correct: false,
      foeDamage: 0,
      playerDamage: 0,
      result: 'continue',
    };
  }
  const points = scoreAnswer(q, a, usedHint);
  const correct = scoreAnswer(q, a, false) === 100;
  const playerDamage = correct ? 0 : CREATURE_HIT;
  const foeHp = Math.max(0, b.foeHp - points);
  let campaign: Campaign = {
    ...c,
    hp: Math.max(0, c.hp - playerDamage),
    answered: { ...c.answered, [q.id]: points },
  };
  const rest = b.queue.slice(1);

  let result: AnswerOutcome['result'];
  let battle: Battle | null = null;
  if (b.kind === 'creature') {
    // A creature asks exactly one question, then it is gone either way.
    campaign = {
      ...campaign,
      defeatedCreatures: [...campaign.defeatedCreatures, b.creatureId],
    };
    result = foeHp === 0 ? 'won' : 'fled';
  } else if (rest.length === 0) {
    campaign = {
      ...campaign,
      bossesDefeated: [...campaign.bossesDefeated, b.region],
    };
    result = 'won';
  } else {
    // Boss HP tracks the questions still to come, so a weak answer doesn't stall the fight.
    battle = { ...b, queue: rest, foeHp: rest.length * 100 };
    result = 'continue';
  }
  if (campaign.hp === 0) result = 'lost';
  return {
    campaign,
    battle: result === 'continue' ? battle : null,
    points,
    correct,
    foeDamage: points,
    playerDamage,
    result,
  };
}

export function heal(c: Campaign, amount: number): Campaign {
  return { ...c, hp: Math.min(MAX_HP, c.hp + amount) };
}

export function respawn(c: Campaign): Campaign {
  return { ...c, hp: MAX_HP };
}

export function regionResult(c: Campaign, chapter: Chapter): ChapterResult {
  const pool = poolFor(chapter, c.difficulty);
  const asked = [...pool.choice, ...pool.boss].filter(
    (q) => q.id in c.answered
  );
  return {
    score: asked.reduce((s, q) => s + c.answered[q.id], 0),
    max: asked.length * 100,
  };
}

export function isCleared(c: Campaign, chapter: Chapter): boolean {
  return (
    c.bossesDefeated.includes(chapter.id) &&
    poolFor(chapter, c.difficulty).choice.every((q) => q.id in c.answered)
  );
}

/** One creature per creature question for the difficulty, minus those already met. */
export function livingCreatures(c: Campaign, chapters: Chapter[]): Spot[] {
  return REGIONS.flatMap((r) => {
    const chapter = chapters.find((ch) => ch.id === r.id)!;
    return creatureSpots(r.id, poolFor(chapter, c.difficulty).choice.length);
  }).filter((s) => !c.defeatedCreatures.includes(s.id));
}
