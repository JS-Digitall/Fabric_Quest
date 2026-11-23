import {
  CHAPTER_IDS,
  SCENE_KINDS,
  sceneBody,
  validateChapter,
  type Chapter,
  type ChapterContentRecord,
  type ChapterId,
  type Issue,
  type Scene,
  type SceneContentRecord,
} from '@rayfin-app/shared';

/** A chapter whose stored content can't be played. */
export class ContentError extends Error {
  constructor(
    readonly chapterId: ChapterId,
    readonly issues: Issue[]
  ) {
    super(issues[0]?.message ?? 'Invalid content');
    this.name = 'ContentError';
  }
}

export type ContentSource = 'starter' | 'database';

export function sceneToRow(
  chapterId: ChapterId,
  scene: Scene,
  position: number
): Omit<SceneContentRecord, 'id'> {
  return {
    chapterId,
    sceneKey: scene.id,
    position,
    kind: scene.kind,
    body: sceneBody(scene),
  };
}

export function rowToScene(row: SceneContentRecord): Scene {
  const fail = (message: string): never => {
    throw new ContentError(row.chapterId as ChapterId, [
      { sceneKey: row.sceneKey, message },
    ]);
  };
  if (!SCENE_KINDS.includes(row.kind as Scene['kind']))
    fail(`Unknown scene type "${row.kind}"`);
  let body: unknown;
  try {
    body = JSON.parse(row.body);
  } catch {
    fail('Stored scene data is damaged');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    fail('Stored scene data is damaged');
  return { ...(body as object), id: row.sceneKey, kind: row.kind } as Scene;
}

export function assembleChapters(
  meta: ChapterContentRecord[],
  rows: SceneContentRecord[],
  starter: Chapter[]
): {
  chapters: Chapter[];
  sources: Record<ChapterId, ContentSource>;
  invalid: ContentError[];
} {
  const chapters: Chapter[] = [];
  const invalid: ContentError[] = [];
  const sources = {} as Record<ChapterId, ContentSource>;

  // shortcut: rows for unknown chapter ids are ignored; chapters are fixed to the map.
  for (const id of CHAPTER_IDS) {
    const base = starter.find((c) => c.id === id)!;
    const own = rows
      .filter((r) => r.chapterId === id)
      .sort((a, b) => a.position - b.position);
    if (own.length === 0) {
      sources[id] = 'starter';
      chapters.push(base);
      continue;
    }
    sources[id] = 'database';
    try {
      const m = meta.find((x) => x.chapterId === id);
      const chapter: Chapter = {
        id,
        title: m?.title ?? base.title,
        tagline: m?.tagline ?? base.tagline,
        scenes: own.map(rowToScene),
      };
      const issues = validateChapter(chapter);
      if (issues.length) throw new ContentError(id, issues);
      chapters.push(chapter);
    } catch (e) {
      if (!(e instanceof ContentError)) throw e;
      invalid.push(e);
    }
  }
  return { chapters, sources, invalid };
}
