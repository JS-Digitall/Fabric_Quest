import { describe, expect, it } from 'vitest';

import type { Chapter, QuestionScene } from '../types';
import {
  CREATURE_HIT,
  answer,
  heal,
  isCleared,
  newCampaign,
  poolFor,
  regionResult,
  respawn,
  startBossBattle,
  startCreatureBattle,
} from './campaign';

const src = 'https://learn.microsoft.com/fabric/x';
const choice = (id: string): QuestionScene => ({
  kind: 'choice',
  id,
  difficulties: ['beginner'],
  prompt: id,
  options: ['wrong', 'right'],
  answer: 1,
  explanation: 'explanation text',
  source: src,
});
const arrange = (id: string): QuestionScene => ({
  kind: 'arrange',
  id,
  difficulties: ['beginner'],
  prompt: id,
  items: ['a', 'b', 'c', 'd'],
  explanation: 'explanation text',
  source: src,
});

const chapter: Chapter = {
  id: 'onelake',
  title: 'T',
  tagline: 't',
  scenes: [
    { kind: 'dialogue', id: 'd', speaker: 's', lines: ['hi'] },
    choice('c1'),
    choice('c2'),
    { ...choice('cx'), difficulties: ['expert'] },
    arrange('b1'),
    arrange('b2'),
  ],
};
const right = { kind: 'choice', index: 1 } as const;
const wrong = { kind: 'choice', index: 0 } as const;

describe('poolFor', () => {
  it('splits a region into creature and boss questions for the difficulty', () => {
    const pool = poolFor(chapter, 'beginner');
    expect(pool.choice.map((q) => q.id)).toEqual(['c1', 'c2']);
    expect(pool.boss.map((q) => q.id)).toEqual(['b1', 'b2']);
  });
});

describe('creature battles', () => {
  it('draws the next unanswered choice question', () => {
    const c = newCampaign('beginner');
    expect(startCreatureBattle(c, chapter, 'x1')?.queue[0].id).toBe('c1');
  });

  it('is won by a correct answer and removes the creature', () => {
    const c = newCampaign('beginner');
    const b = startCreatureBattle(c, chapter, 'x1')!;
    const out = answer(c, b, right, false);
    expect(out).toMatchObject({
      points: 100,
      correct: true,
      foeDamage: 100,
      playerDamage: 0,
      result: 'won',
    });
    expect(out.campaign.answered).toEqual({ c1: 100 });
    expect(out.campaign.defeatedCreatures).toEqual(['x1']);
    expect(out.campaign.hp).toBe(100);
  });

  it('flees after a wrong answer, hits the player and still uses up the question', () => {
    const c = newCampaign('beginner');
    const b = startCreatureBattle(c, chapter, 'x1')!;
    const out = answer(c, b, wrong, false);
    expect(out).toMatchObject({
      points: 0,
      correct: false,
      playerDamage: CREATURE_HIT,
      result: 'fled',
    });
    expect(out.campaign.hp).toBe(100 - CREATURE_HIT);
    expect(out.campaign.defeatedCreatures).toEqual(['x1']);
    expect(startCreatureBattle(out.campaign, chapter, 'x2')?.queue[0].id).toBe(
      'c2'
    );
  });

  it('halves damage when the hint was used but counts as correct', () => {
    const c = newCampaign('beginner');
    const out = answer(c, startCreatureBattle(c, chapter, 'x1')!, right, true);
    expect(out).toMatchObject({
      points: 50,
      correct: true,
      playerDamage: 0,
      result: 'fled',
    });
  });

  it('returns null when no choice question is left', () => {
    let c = newCampaign('beginner');
    c = answer(
      c,
      startCreatureBattle(c, chapter, 'x1')!,
      right,
      false
    ).campaign;
    c = answer(
      c,
      startCreatureBattle(c, chapter, 'x2')!,
      right,
      false
    ).campaign;
    expect(startCreatureBattle(c, chapter, 'x3')).toBeNull();
  });

  it('is lost when HP reaches zero, clamped at 0', () => {
    const c = { ...newCampaign('beginner'), hp: 10 };
    const out = answer(c, startCreatureBattle(c, chapter, 'x1')!, wrong, false);
    expect(out.result).toBe('lost');
    expect(out.campaign.hp).toBe(0);
  });

  it('ignores a second answer to an already answered question', () => {
    const c = newCampaign('beginner');
    const b = startCreatureBattle(c, chapter, 'x1')!;
    const first = answer(c, b, right, false);
    const again = answer(first.campaign, b, right, false);
    expect(again.points).toBe(0);
    expect(again.campaign).toBe(first.campaign);
    expect(regionResult(again.campaign, chapter)).toEqual({
      score: 100,
      max: 100,
    });
  });
});

describe('boss battles', () => {
  it('has 100 HP per remaining question and continues until the queue is empty', () => {
    const c = newCampaign('beginner');
    const b = startBossBattle(c, chapter)!;
    expect(b).toMatchObject({ kind: 'boss', foeHp: 200, foeMax: 200 });
    const one = answer(
      c,
      b,
      { kind: 'order', items: ['a', 'b', 'c', 'd'] },
      false
    );
    expect(one.result).toBe('continue');
    expect(one.battle).toMatchObject({ foeHp: 100 });
    expect(one.battle?.queue[0].id).toBe('b2');
    const two = answer(
      one.campaign,
      one.battle!,
      { kind: 'order', items: ['a', 'b', 'c', 'd'] },
      false
    );
    expect(two.result).toBe('won');
    expect(two.campaign.bossesDefeated).toEqual(['onelake']);
  });

  it('keeps answered boss questions after a mid-boss death and resets HP to the rest', () => {
    let c = { ...newCampaign('beginner'), hp: 20 };
    const b = startBossBattle(c, chapter)!;
    const out = answer(
      c,
      b,
      { kind: 'order', items: ['d', 'c', 'b', 'a'] },
      false
    );
    expect(out.result).toBe('lost');
    c = respawn(out.campaign);
    expect(c.hp).toBe(100);
    expect(c.answered).toEqual({ b1: 0 });
    expect(startBossBattle(c, chapter)).toMatchObject({
      foeHp: 100,
      foeMax: 100,
    });
  });
});

describe('progress', () => {
  it('is not cleared while the boss lives, even with all choices answered', () => {
    let c = newCampaign('beginner');
    c = answer(
      c,
      startCreatureBattle(c, chapter, 'x1')!,
      right,
      false
    ).campaign;
    c = answer(
      c,
      startCreatureBattle(c, chapter, 'x2')!,
      right,
      false
    ).campaign;
    expect(isCleared(c, chapter)).toBe(false);
    let b = startBossBattle(c, chapter)!;
    let out = answer(
      c,
      b,
      { kind: 'order', items: ['a', 'b', 'c', 'd'] },
      false
    );
    b = out.battle!;
    out = answer(
      out.campaign,
      b,
      { kind: 'order', items: ['a', 'b', 'c', 'd'] },
      false
    );
    expect(isCleared(out.campaign, chapter)).toBe(true);
  });

  it('reports the answered score and max for a region', () => {
    let c = newCampaign('beginner');
    c = answer(
      c,
      startCreatureBattle(c, chapter, 'x1')!,
      wrong,
      false
    ).campaign;
    expect(regionResult(c, chapter)).toEqual({ score: 0, max: 100 });
    expect(regionResult(newCampaign('beginner'), chapter)).toEqual({
      score: 0,
      max: 0,
    });
  });

  it('heals up to 100', () => {
    expect(heal({ ...newCampaign('beginner'), hp: 80 }, 40).hp).toBe(100);
  });
});
