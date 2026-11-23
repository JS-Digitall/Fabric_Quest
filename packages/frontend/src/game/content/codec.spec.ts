import type { SceneContentRecord } from '@rayfin-app/shared';
import { describe, expect, it } from 'vitest';

import { assembleChapters, rowToScene, sceneToRow } from './codec';
import { chapters } from './index';

const governance = chapters.find((c) => c.id === 'governance')!;
const rowsFor = (chapter = governance): SceneContentRecord[] =>
  chapter.scenes.map((s, i) => ({
    id: `row-${s.id}`,
    ...sceneToRow(chapter.id, s, i),
  }));

describe('scene rows', () => {
  it('round-trips every starter scene', () => {
    for (const c of chapters)
      c.scenes.forEach((s, i) => {
        const row = { id: 'r', ...sceneToRow(c.id, s, i) };
        expect(rowToScene(row)).toEqual(s);
      });
  });
});

describe('assembleChapters', () => {
  it('uses starter content when the database is empty', () => {
    const r = assembleChapters([], [], chapters);
    expect(r.chapters).toEqual(chapters);
    expect(Object.values(r.sources)).toEqual(Array(6).fill('starter'));
    expect(r.invalid).toEqual([]);
  });

  it('uses database rows only for chapters that have them', () => {
    const rows = rowsFor().reverse(); // order comes from position
    const meta = [
      { id: 'm', chapterId: 'governance', title: 'Renamed', tagline: 'New' },
    ];
    const r = assembleChapters(meta, rows, chapters);
    expect(r.sources.governance).toBe('database');
    expect(r.sources.onelake).toBe('starter');
    const g = r.chapters.find((c) => c.id === 'governance')!;
    expect(g.title).toBe('Renamed');
    expect(g.scenes).toEqual(governance.scenes);
  });

  it('reports a corrupt body against its chapter', () => {
    const rows = rowsFor();
    rows[1] = { ...rows[1], body: '{' };
    const r = assembleChapters([], rows, chapters);
    expect(r.invalid[0].chapterId).toBe('governance');
    expect(r.chapters.find((c) => c.id === 'governance')).toBeUndefined();
  });

  it('reports a scene whose stored fields are missing', () => {
    const rows = rowsFor();
    const i = rows.findIndex((r) => r.kind === 'choice');
    rows[i] = { ...rows[i], body: '{}' };
    const r = assembleChapters([], rows, chapters);
    expect(r.invalid.map((e) => e.chapterId)).toEqual(['governance']);
  });

  it('reports an unknown scene kind', () => {
    const rows = rowsFor();
    rows[1] = { ...rows[1], kind: 'quiz' };
    const r = assembleChapters([], rows, chapters);
    expect(r.invalid.map((e) => e.chapterId)).toEqual(['governance']);
  });

  it('reports a database chapter that breaks the game rules', () => {
    const rows = rowsFor().filter((r) => r.kind === 'dialogue');
    const r = assembleChapters([], rows, chapters);
    expect(r.invalid[0].issues.length).toBeGreaterThan(0);
  });
});
