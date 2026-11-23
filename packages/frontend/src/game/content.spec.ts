import { CHAPTER_IDS } from '@rayfin-app/shared';
import { describe, expect, it } from 'vitest';

import { chapters } from './content';
import type { QuestionScene } from './types';

// Playability rules live in `validateChapter` (see validate.spec.ts); these
// are the starter content's own editorial choices.
const questions = (c: (typeof chapters)[number]) =>
  c.scenes.filter((s): s is QuestionScene => s.kind !== 'dialogue');

describe('starter content', () => {
  it('has the six chapters in map order', () => {
    expect(chapters.map((c) => c.id)).toEqual([...CHAPTER_IDS]);
  });

  it('uses unique scene ids across chapters', () => {
    const ids = chapters.flatMap((c) => c.scenes.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

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
