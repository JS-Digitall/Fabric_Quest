import { describe, expect, it } from 'vitest';

import { maxScore, recordResult, scenesFor, scoreAnswer } from './engine';
import type {
  ArrangeScene,
  Chapter,
  ChoiceScene,
  GameState,
  MatchScene,
} from './types';

const base = { explanation: 'x', source: 'https://learn.microsoft.com/x' };
const choice: ChoiceScene = {
  ...base,
  kind: 'choice',
  id: 'c1',
  difficulties: ['beginner'],
  prompt: '?',
  options: ['a', 'b'],
  answer: 1,
};
const arrange: ArrangeScene = {
  ...base,
  kind: 'arrange',
  id: 'a1',
  difficulties: ['expert'],
  prompt: '?',
  items: ['1', '2', '3', '4'],
};
const match: MatchScene = {
  ...base,
  kind: 'match',
  id: 'm1',
  difficulties: ['practitioner'],
  prompt: '?',
  pairs: [
    ['A', 'a'],
    ['B', 'b'],
    ['C', 'c'],
    ['D', 'd'],
  ],
};
const chapter: Chapter = {
  id: 'onelake',
  title: 't',
  tagline: 't',
  scenes: [
    { kind: 'dialogue', id: 'd1', speaker: 's', lines: ['hi'] },
    choice,
    arrange,
  ],
};

describe('scenesFor', () => {
  it('keeps dialogue and drops questions without the difficulty', () => {
    expect(scenesFor(chapter, 'beginner').map((s) => s.id)).toEqual([
      'd1',
      'c1',
    ]);
  });

  it('still returns dialogue when no question fits', () => {
    expect(scenesFor(chapter, 'practitioner').map((s) => s.id)).toEqual([
      'd1',
    ]);
  });
});

describe('scoreAnswer', () => {
  it('gives 100 for a correct choice and 0 for a wrong one', () => {
    expect(scoreAnswer(choice, { kind: 'choice', index: 1 }, false)).toBe(100);
    expect(scoreAnswer(choice, { kind: 'choice', index: 0 }, false)).toBe(0);
  });

  it('halves the points when a hint was used', () => {
    expect(scoreAnswer(choice, { kind: 'choice', index: 1 }, true)).toBe(50);
  });

  it('gives partial credit per correct position in arrange', () => {
    expect(
      scoreAnswer(arrange, { kind: 'order', items: ['1', '2', '4', '3'] }, false)
    ).toBe(50);
  });

  it('gives partial credit per correct pair regardless of pair order', () => {
    const pairs: [string, string][] = [
      ['D', 'c'],
      ['B', 'b'],
      ['A', 'a'],
      ['C', 'd'],
    ];
    expect(scoreAnswer(match, { kind: 'pairs', pairs }, false)).toBe(50);
    const three: [string, string][] = [
      ['C', 'c'],
      ['A', 'a'],
      ['B', 'b'],
      ['D', 'x'],
    ];
    expect(scoreAnswer(match, { kind: 'pairs', pairs: three }, false)).toBe(75);
  });

  it('rounds partial credit', () => {
    const three = { ...arrange, items: ['1', '2', '3'] };
    expect(
      scoreAnswer(three, { kind: 'order', items: ['1', '3', '2'] }, false)
    ).toBe(33);
  });

  it('scores 0 when the answer kind does not fit the scene', () => {
    expect(scoreAnswer(choice, { kind: 'order', items: [] }, false)).toBe(0);
  });
});

describe('maxScore', () => {
  it('is 100 per question and 0 for no scenes', () => {
    expect(maxScore(chapter.scenes)).toBe(200);
    expect(maxScore([])).toBe(0);
  });
});

describe('recordResult', () => {
  it('replaces a chapter score on replay', () => {
    const start: GameState = { difficulty: 'beginner', results: {} };
    const once = recordResult(start, 'onelake', 100, 200);
    const twice = recordResult(once, 'onelake', 50, 200);
    expect(twice.results).toEqual({ onelake: { score: 50, max: 200 } });
    expect(start.results).toEqual({});
  });
});
