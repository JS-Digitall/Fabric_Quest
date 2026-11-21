import { describe, expect, it } from 'vitest';

import { chapters } from './content';
import { scenesFor } from './engine';
import type { Difficulty, QuestionScene } from './types';

const difficulties: Difficulty[] = ['beginner', 'practitioner', 'expert'];
const LEARN = /^https:\/\/learn\.microsoft\.com\//;
const questions = (c: (typeof chapters)[number]) =>
  c.scenes.filter((s): s is QuestionScene => s.kind !== 'dialogue');

describe('chapter content', () => {
  it('has the six chapters in map order', () => {
    expect(chapters.map((c) => c.id)).toEqual([
      'onelake',
      'ingest',
      'semantic',
      'governance',
      'fabriciq',
      'apps',
    ]);
  });

  it('uses unique scene ids', () => {
    const ids = chapters.flatMap((c) => c.scenes.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(chapters.map((c) => [c.id, c] as const))(
    '%s: every question has an explanation and an allowed source',
    (id, chapter) => {
      for (const q of questions(chapter)) {
        expect(q.explanation.length, q.id).toBeGreaterThan(20);
        const ok =
          LEARN.test(q.source) ||
          (id === 'apps' && q.source.startsWith('rayfin-docs:'));
        expect(ok, `${q.id}: ${q.source}`).toBe(true);
        expect(q.difficulties.length, q.id).toBeGreaterThan(0);
      }
    }
  );

  it.each(chapters.map((c) => [c.id, c] as const))(
    '%s: at least 4 questions per difficulty',
    (_id, chapter) => {
      for (const d of difficulties) {
        const n = scenesFor(chapter, d).filter(
          (s) => s.kind !== 'dialogue'
        ).length;
        expect(n, d).toBeGreaterThanOrEqual(4);
      }
    }
  );

  it.each(chapters.map((c) => [c.id, c] as const))(
    '%s: answers are well-formed',
    (_id, chapter) => {
      for (const q of questions(chapter)) {
        if (q.kind === 'choice' || q.kind === 'dashboard') {
          expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
          expect(q.answer, q.id).toBeLessThan(q.options.length);
        }
        if (q.kind === 'arrange')
          expect(q.items.length, q.id).toBeGreaterThanOrEqual(3);
        if (q.kind === 'match') {
          expect(q.pairs.length, q.id).toBeGreaterThanOrEqual(3);
          expect(new Set(q.pairs.map((p) => p[0])).size, q.id).toBe(
            q.pairs.length
          );
          expect(new Set(q.pairs.map((p) => p[1])).size, q.id).toBe(
            q.pairs.length
          );
        }
      }
    }
  );

  it.each(chapters.map((c) => [c.id, c] as const))(
    '%s: has an arrange or match puzzle',
    (_id, chapter) => {
      expect(
        questions(chapter).some(
          (q) => q.kind === 'arrange' || q.kind === 'match'
        )
      ).toBe(true);
    }
  );

  it.each(chapters.map((c) => [c.id, c] as const))(
    '%s: every difficulty has creature (choice) and boss questions',
    (_id, chapter) => {
      for (const d of difficulties) {
        const qs = scenesFor(chapter, d);
        expect(
          qs.some((s) => s.kind === 'choice'),
          `${d} choice`
        ).toBe(true);
        expect(
          qs.some(
            (s) =>
              s.kind === 'arrange' ||
              s.kind === 'match' ||
              s.kind === 'dashboard'
          ),
          `${d} boss`
        ).toBe(true);
      }
    }
  );

  it('explanations contain no markdown backticks', () => {
    for (const c of chapters)
      for (const q of questions(c))
        expect(q.explanation, q.id).not.toContain('`');
  });

  it('has dashboards in the semantic and apps chapters', () => {
    for (const id of ['semantic', 'apps']) {
      const c = chapters.find((ch) => ch.id === id)!;
      expect(
        questions(c).some((q) => q.kind === 'dashboard'),
        id
      ).toBe(true);
    }
  });
});
