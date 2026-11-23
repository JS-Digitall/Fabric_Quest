import type {
  ChoiceScene,
  SceneContentRecord,
} from '@rayfin-app/shared';
import { describe, expect, it, vi } from 'vitest';

import { sceneToRow } from '../content/codec';
import { chapters } from '../content';
import {
  copyStarter,
  deleteScene,
  moveScene,
  newSceneKey,
  saveScene,
  ValidationBlockedError,
  WriteRefusedError,
  type RepoClient,
} from './repo';

const governance = chapters.find((c) => c.id === 'governance')!;
const rowsOf = (): SceneContentRecord[] =>
  governance.scenes.map((s, i) => ({
    id: `row${i}`,
    ...sceneToRow('governance', s, i),
  }));

function fakeClient(fail?: (op: string, n: number) => unknown) {
  const log: { op: string; entity: string; args: unknown[] }[] = [];
  let n = 0;
  const entity = (name: string) =>
    Object.fromEntries(
      ['create', 'update', 'delete'].map((op) => [
        op,
        vi.fn(async (...args: unknown[]) => {
          n++;
          const err = fail?.(op, n);
          if (err) throw err;
          log.push({ op, entity: name, args });
          return { id: `new${n}`, ...(args.at(-1) as object) };
        }),
      ])
    );
  const client = {
    data: {
      SceneContent: entity('SceneContent'),
      ChapterContent: entity('ChapterContent'),
    },
  } as unknown as RepoClient;
  return { client, log };
}

const sceneCreates = (log: ReturnType<typeof fakeClient>['log']) =>
  log.filter((l) => l.entity === 'SceneContent' && l.op === 'create');

describe('copyStarter', () => {
  it('creates only scenes that are not stored yet', async () => {
    const { client, log } = fakeClient();
    const existing = new Set(governance.scenes.slice(0, 3).map((s) => s.id));
    const r = await copyStarter(client, governance, existing, null);
    expect(sceneCreates(log)).toHaveLength(governance.scenes.length - 3);
    expect(r.failed).toEqual([]);
  });

  it('writes nothing when everything is already stored', async () => {
    const { client, log } = fakeClient();
    const all = new Set(governance.scenes.map((s) => s.id));
    await copyStarter(client, governance, all, 'meta1');
    expect(sceneCreates(log)).toHaveLength(0);
  });

  it('keeps going past a failed scene and reports it', async () => {
    const { client, log } = fakeClient((op, n) =>
      op === 'create' && n === 3 ? new Error('boom') : undefined
    );
    const r = await copyStarter(client, governance, new Set(), null);
    expect(r.failed).toHaveLength(1);
    expect(sceneCreates(log)).toHaveLength(governance.scenes.length - 1);
  });
});

describe('saveScene', () => {
  it('blocks a save that breaks the chapter without writing', async () => {
    const { client, log } = fakeClient();
    const choice = governance.scenes.find(
      (s): s is ChoiceScene => s.kind === 'choice'
    )!;
    const broken = { ...choice, answer: 99 };
    await expect(
      saveScene(client, governance, rowsOf(), broken)
    ).rejects.toBeInstanceOf(ValidationBlockedError);
    expect(log).toHaveLength(0);
  });

  it('inserts a new question before the Outro', async () => {
    const { client, log } = fakeClient();
    const template = governance.scenes.find(
      (s): s is ChoiceScene => s.kind === 'choice'
    )!;
    const added = { ...template, id: 'governance-new-abcd' };
    const rows = rowsOf();
    await saveScene(client, governance, rows, added);
    const created = sceneCreates(log)[0].args[0] as SceneContentRecord;
    expect(created.position).toBe(rows.length - 1);
    const outroMove = log.find((l) => l.op === 'update');
    expect(outroMove?.args).toEqual([
      { id: rows.at(-1)!.id },
      { position: rows.length },
    ]);
  });

  it('turns a refused write into WriteRefusedError', async () => {
    const { client } = fakeClient(() =>
      Object.assign(new Error('Forbidden'), { status: 403 })
    );
    const s = governance.scenes[1];
    await expect(
      saveScene(client, governance, rowsOf(), s)
    ).rejects.toBeInstanceOf(WriteRefusedError);
  });
});

describe('deleteScene and moveScene', () => {
  it('never deletes a story scene', async () => {
    const { client, log } = fakeClient();
    await expect(
      deleteScene(client, governance, rowsOf(), governance.scenes[0].id)
    ).rejects.toThrow();
    expect(log).toHaveLength(0);
  });

  it('does not move the first question above the Intro', async () => {
    const { client, log } = fakeClient();
    await moveScene(client, rowsOf(), governance.scenes[1].id, -1);
    expect(log).toHaveLength(0);
  });

  it('swaps positions with the neighbour', async () => {
    const { client, log } = fakeClient();
    const rows = rowsOf();
    await moveScene(client, rows, governance.scenes[1].id, 1);
    expect(log.map((l) => l.args)).toEqual([
      [{ id: 'row1' }, { position: 2 }],
      [{ id: 'row2' }, { position: 1 }],
    ]);
  });
});

describe('newSceneKey', () => {
  it('builds a unique key from the prompt', () => {
    const key = newSceneKey('governance', 'Who can share a report?', new Set());
    expect(key).toMatch(/^governance-who-can-share-a-report-[a-z0-9]{4}$/);
    expect(key.length).toBeLessThanOrEqual(80);
  });
});
