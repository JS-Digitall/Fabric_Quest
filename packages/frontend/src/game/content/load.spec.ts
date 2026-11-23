import { describe, expect, it, vi } from 'vitest';

import { loadContent, type ContentClient } from './load';

type Page = { items: unknown[]; hasNextPage: boolean; endCursor?: string };

/** A fluent query fake: each executePaginated() returns the next page. */
function entity(pages: (Page | Error)[]) {
  const calls: (string | undefined)[] = [];
  let cursor: string | undefined;
  const q = {
    select: () => q,
    orderBy: () => q,
    first: () => q,
    after: (c: string) => ((cursor = c), q),
    executePaginated: vi.fn(async () => {
      calls.push(cursor);
      cursor = undefined;
      const next = pages.shift()!;
      if (next instanceof Error) throw next;
      return next;
    }),
  };
  return { q, calls };
}

const client = (scene: ReturnType<typeof entity>, chapter = entity([{ items: [], hasNextPage: false }])) =>
  ({ data: { SceneContent: scene.q, ChapterContent: chapter.q } }) as unknown as ContentClient;

const noWait = { sleep: async () => {} };

const transient = Object.assign(new Error('busy'), {
  name: 'NetworkError',
  status: 503,
});

describe('loadContent', () => {
  it('pages until there are no more rows', async () => {
    const scenes = entity([
      { items: [{ id: 'a' }], hasNextPage: true, endCursor: 'c1' },
      { items: [{ id: 'b' }], hasNextPage: false },
    ]);
    const r = await loadContent(client(scenes), noWait);
    expect(r.rows.map((x) => x.id)).toEqual(['a', 'b']);
    expect(scenes.calls).toEqual([undefined, 'c1']);
  });

  it('gives up at once on a permanent error', async () => {
    const scenes = entity([new Error('Forbidden')]);
    await expect(loadContent(client(scenes), noWait)).rejects.toThrow(
      'Forbidden'
    );
    expect(scenes.q.executePaginated).toHaveBeenCalledTimes(1);
  });

  it('retries a transient error', async () => {
    const scenes = entity([transient, { items: [], hasNextPage: false }]);
    await loadContent(client(scenes), noWait);
    expect(scenes.q.executePaginated).toHaveBeenCalledTimes(2);
  });

  it('stops retrying after 3 attempts', async () => {
    const scenes = entity([transient, transient, transient, transient]);
    await expect(loadContent(client(scenes), noWait)).rejects.toThrow('busy');
    expect(scenes.q.executePaginated).toHaveBeenCalledTimes(3);
  });
});
