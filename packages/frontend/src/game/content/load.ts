import type {
  ChapterContentRecord,
  SceneContentRecord,
} from '@rayfin-app/shared';

import type { AppClient } from '@/lib/rayfin-client';

export type ContentClient = Pick<AppClient, 'data'>;

export interface StoredContent {
  meta: ChapterContentRecord[];
  rows: SceneContentRecord[];
}

const PAGE = 500;
const ATTEMPTS = 3;
const TRANSIENT = new Set([429, 502, 503, 504]);

/** Only throttling and gateway hiccups are worth retrying. */
export function isTransient(e: unknown): boolean {
  const status = (e as { status?: unknown } | null)?.status;
  return typeof status === 'number' && TRANSIENT.has(status);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  sleep: (ms: number) => Promise<void>
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= ATTEMPTS || !isTransient(e)) throw e;
      await sleep(500 * 2 ** (attempt - 1));
    }
  }
}

interface Paged<T> {
  first(n: number): Paged<T>;
  after(cursor: string): Paged<T>;
  executePaginated(): Promise<{
    items: T[];
    hasNextPage: boolean;
    endCursor?: string | null;
  }>;
}

async function readAll<T>(
  query: () => Paged<T>,
  sleep: (ms: number) => Promise<void>
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const at = cursor;
    const page = await withRetry(() => {
      const q = query().first(PAGE);
      return (at ? q.after(at) : q).executePaginated();
    }, sleep);
    all.push(...page.items);
    if (!page.hasNextPage || !page.endCursor) return all;
    cursor = page.endCursor;
  }
}

/** Reads every stored chapter and scene, paging past the 100-row default. */
export async function loadContent(
  client: ContentClient,
  { sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) } = {}
): Promise<StoredContent> {
  const [meta, rows] = await Promise.all([
    readAll(
      () =>
        client.data.ChapterContent.select([
          'id',
          'chapterId',
          'title',
          'tagline',
        ]).orderBy({ chapterId: 'asc' }) as unknown as Paged<ChapterContentRecord>,
      sleep
    ),
    readAll(
      () =>
        client.data.SceneContent.select([
          'id',
          'chapterId',
          'sceneKey',
          'position',
          'kind',
          'body',
        ]).orderBy({ sceneKey: 'asc' }) as unknown as Paged<SceneContentRecord>,
      sleep
    ),
  ]);
  // The wire can return numbers as strings; positions drive scene order.
  return { meta, rows: rows.map((r) => ({ ...r, position: Number(r.position) })) };
}
