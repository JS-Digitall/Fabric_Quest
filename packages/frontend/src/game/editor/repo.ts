import {
  sceneBody,
  validateChapter,
  type Chapter,
  type ChapterId,
  type Issue,
  type Scene,
  type SceneContentRecord,
} from '@rayfin-app/shared';

import type { AppClient } from '@/lib/rayfin-client';

import { sceneToRow } from '../content/codec';

export type RepoClient = Pick<AppClient, 'data'>;

/** The server refused the write: the signed-in user isn't an editor. */
export class WriteRefusedError extends Error {
  constructor(cause: unknown) {
    super('You’re not on this app’s editor list.', { cause });
    this.name = 'WriteRefusedError';
  }
}

/** The change would leave the chapter unplayable; nothing was written. */
export class ValidationBlockedError extends Error {
  constructor(readonly issues: Issue[]) {
    super(issues[0]?.message ?? 'This change would break the chapter');
    this.name = 'ValidationBlockedError';
  }
}

function isRefusal(e: unknown): boolean {
  const status = (e as { status?: unknown } | null)?.status;
  if (status === 401 || status === 403) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /not authori[sz]ed|forbidden|permission/i.test(msg);
}

async function guard<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (e) {
    throw isRefusal(e) ? new WriteRefusedError(e) : e;
  }
}

function check(chapter: Chapter) {
  const issues = validateChapter(chapter);
  if (issues.length) throw new ValidationBlockedError(issues);
}

const byPosition = (rows: SceneContentRecord[]) =>
  [...rows].sort((a, b) => a.position - b.position);

/** Stores the starter chapter; safe to re-run after a partial failure. */
export async function copyStarter(
  client: RepoClient,
  chapter: Chapter,
  existingKeys: Set<string>,
  metaId: string | null
): Promise<{ written: number; failed: string[] }> {
  if (!metaId)
    await guard(() =>
      client.data.ChapterContent.create({
        chapterId: chapter.id,
        title: chapter.title,
        tagline: chapter.tagline,
      })
    );
  let written = 0;
  const failed: string[] = [];
  for (const [i, scene] of chapter.scenes.entries()) {
    if (existingKeys.has(scene.id)) continue;
    try {
      await guard(() =>
        client.data.SceneContent.create(sceneToRow(chapter.id, scene, i))
      );
      written++;
    } catch (e) {
      if (e instanceof WriteRefusedError) throw e;
      failed.push(scene.id);
    }
  }
  return { written, failed };
}

export async function saveChapterMeta(
  client: RepoClient,
  chapterId: ChapterId,
  meta: { title: string; tagline: string },
  metaId: string | null
): Promise<void> {
  await guard(() =>
    metaId
      ? client.data.ChapterContent.update({ id: metaId }, meta)
      : client.data.ChapterContent.create({ chapterId, ...meta })
  );
}

/** Updates a stored scene, or inserts a new one just before the Outro. */
export async function saveScene(
  client: RepoClient,
  chapter: Chapter,
  rows: SceneContentRecord[],
  scene: Scene
): Promise<void> {
  const row = rows.find((r) => r.sceneKey === scene.id);
  const scenes = row
    ? chapter.scenes.map((s) => (s.id === scene.id ? scene : s))
    : [...chapter.scenes.slice(0, -1), scene, ...chapter.scenes.slice(-1)];
  check({ ...chapter, scenes });

  if (row) {
    await guard(() =>
      client.data.SceneContent.update({ id: row.id }, { body: sceneBody(scene) })
    );
    return;
  }
  const outro = byPosition(rows).at(-1)!;
  await guard(() =>
    client.data.SceneContent.update(
      { id: outro.id },
      { position: outro.position + 1 }
    )
  );
  await guard(() =>
    client.data.SceneContent.create(
      sceneToRow(chapter.id, scene, outro.position)
    )
  );
}

export async function deleteScene(
  client: RepoClient,
  chapter: Chapter,
  rows: SceneContentRecord[],
  sceneKey: string
): Promise<void> {
  const scene = chapter.scenes.find((s) => s.id === sceneKey);
  if (!scene || scene.kind === 'dialogue')
    throw new Error('Story scenes can’t be deleted');
  check({ ...chapter, scenes: chapter.scenes.filter((s) => s !== scene) });
  const row = rows.find((r) => r.sceneKey === sceneKey)!;
  await guard(() => client.data.SceneContent.delete({ id: row.id }));
}

/** Swaps a question with its neighbour; never crosses the Intro or Outro. */
export async function moveScene(
  client: RepoClient,
  rows: SceneContentRecord[],
  sceneKey: string,
  dir: -1 | 1
): Promise<void> {
  const sorted = byPosition(rows);
  const i = sorted.findIndex((r) => r.sceneKey === sceneKey);
  const a = sorted[i];
  const b = sorted[i + dir];
  if (!a || !b || a.kind === 'dialogue' || b.kind === 'dialogue') return;
  await guard(() =>
    client.data.SceneContent.update({ id: a.id }, { position: b.position })
  );
  await guard(() =>
    client.data.SceneContent.update({ id: b.id }, { position: a.position })
  );
}

/** Removes the chapter's stored content so it plays the starter version. */
export async function resetChapter(
  client: RepoClient,
  rows: SceneContentRecord[],
  metaId: string | null
): Promise<void> {
  for (const r of rows)
    await guard(() => client.data.SceneContent.delete({ id: r.id }));
  if (metaId)
    await guard(() => client.data.ChapterContent.delete({ id: metaId }));
}

export function newSceneKey(
  chapterId: ChapterId,
  prompt: string,
  taken: Set<string>
): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 24)
    .replace(/^-+|-+$/g, '');
  for (;;) {
    const tail = Math.random().toString(36).slice(2, 6).padEnd(4, '0');
    const key = [chapterId, slug, tail].filter(Boolean).join('-');
    if (!taken.has(key)) return key;
  }
}
