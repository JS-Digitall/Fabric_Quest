import {
  validateChapter,
  validateScene,
  type Chapter,
  type ChoiceScene,
  type Scene,
} from '@rayfin-app/shared';
import { describe, expect, it } from 'vitest';

import { chapters } from './content';

const byId = (id: string) => chapters.find((c) => c.id === id)!;
const isQuestion = (s: Scene) => s.kind !== 'dialogue';

describe('validateChapter', () => {
  it.each(chapters.map((c) => [c.id, c] as const))(
    'accepts the %s starter chapter',
    (_id, chapter) => {
      expect(validateChapter(chapter)).toEqual([]);
    }
  );

  it('rejects a third story scene', () => {
    const c = byId('governance');
    const extra = { ...c.scenes[0], id: 'governance-extra' };
    const scenes = [...c.scenes];
    scenes.splice(2, 0, extra);
    expect(validateChapter({ ...c, scenes }).length).toBeGreaterThan(0);
  });

  it('rejects an Intro that is not first', () => {
    const c = byId('governance');
    const [intro, a, b, ...rest] = c.scenes;
    const issues = validateChapter({ ...c, scenes: [a, b, intro, ...rest] });
    expect(issues.length).toBeGreaterThan(0);
  });

  it('names the difficulty that drops below 4 questions', () => {
    // Keep only the first 3 expert questions tagged expert.
    const c = byId('governance');
    let kept = 0;
    const scenes = c.scenes.flatMap((s): Scene[] => {
      if (!isQuestion(s) || !s.difficulties.includes('expert')) return [s];
      if (kept++ < 3) return [s];
      const rest = s.difficulties.filter((d) => d !== 'expert');
      return rest.length ? [{ ...s, difficulties: rest }] : [];
    });
    const issues = validateChapter({ ...c, scenes });
    expect(issues.map((i) => i.message)).toContain(
      'Expert needs at least 4 questions (has 3)'
    );
  });

  it('requires a boss question for every difficulty', () => {
    const c = byId('onelake');
    const chapter: Chapter = {
      ...c,
      scenes: c.scenes.filter(
        (s) =>
          !(
            isQuestion(s) &&
            s.kind !== 'choice' &&
            s.difficulties.includes('beginner')
          )
      ),
    };
    expect(validateChapter(chapter).map((i) => i.message)).toContain(
      'Beginner needs a puzzle or chart question for the boss'
    );
  });

  it('rejects duplicate scene keys', () => {
    const c = byId('ingest');
    const scenes = c.scenes.map((s, i) =>
      i === 2 ? { ...s, id: c.scenes[1].id } : s
    );
    expect(validateChapter({ ...c, scenes }).length).toBeGreaterThan(0);
  });
});

describe('validateScene', () => {
  const choice = byId('onelake').scenes.find(
    (s): s is ChoiceScene => s.kind === 'choice'
  )!;

  it('flags an answer past the options', () => {
    const issues = validateScene({ ...choice, answer: choice.options.length });
    expect(issues.map((i) => i.field)).toContain('answer');
  });

  it('flags a body over 4000 characters', () => {
    const issues = validateScene({
      ...choice,
      explanation: 'x'.repeat(4000),
    });
    expect(issues.map((i) => i.field)).toContain('body');
  });

  it('flags a source that is not a web link', () => {
    const issues = validateScene({ ...choice, source: 'see the wiki' });
    expect(issues.map((i) => i.field)).toContain('source');
  });

  it('accepts a team’s own https source', () => {
    const issues = validateScene({
      ...choice,
      source: 'https://wiki.contoso.com/onboarding',
    });
    expect(issues.map((i) => i.field)).not.toContain('source');
  });

  it('flags a chart bar without a number', () => {
    const dash = byId('semantic').scenes.find((s) => s.kind === 'dashboard')!;
    if (dash.kind !== 'dashboard') throw new Error('fixture');
    const rows = dash.chart.rows.map((r, i) =>
      i === 0 ? { ...r, [dash.chart.y]: NaN } : r
    );
    const issues = validateScene({ ...dash, chart: { ...dash.chart, rows } });
    expect(issues.map((i) => i.field)).toContain('chart');
  });

  it('flags a story scene with no lines', () => {
    const intro = byId('onelake').scenes[0];
    expect(intro.kind).toBe('dialogue');
    const issues = validateScene({ ...intro, lines: [] } as Scene);
    expect(issues.map((i) => i.field)).toContain('lines');
  });
});
