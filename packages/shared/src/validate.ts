import {
  DIFFICULTIES,
  type Chapter,
  type ChapterId,
  type Difficulty,
  type Scene,
} from './content.js';

/** One problem that keeps content from being playable. */
export interface Issue {
  sceneKey?: string;
  field?: string;
  message: string;
}

export const MAX_BODY = 4000;
export const MIN_QUESTIONS_PER_DIFFICULTY = 4;
const LEARN = /^https:\/\/learn\.microsoft\.com\//;

const label = (d: Difficulty) => d[0].toUpperCase() + d.slice(1);
const blank = (s: unknown) => typeof s !== 'string' || s.trim() === '';
const dupes = (xs: string[]) => new Set(xs).size !== xs.length;

/** The JSON stored in a row's `body`: the scene without `id` and `kind`. */
export function sceneBody(scene: Scene): string {
  const { id: _id, kind: _kind, ...rest } = scene;
  return JSON.stringify(rest);
}

export function validateScene(scene: Scene, chapterId?: ChapterId): Issue[] {
  const issues: Issue[] = [];
  const add = (field: string, message: string) =>
    issues.push({ sceneKey: scene.id, field, message });

  if (blank(scene.id) || scene.id.length > 80)
    add('id', 'Needs an id of at most 80 characters');
  if (sceneBody(scene).length > MAX_BODY)
    add('body', `Too long to save (over ${MAX_BODY} characters in total)`);

  if (scene.kind === 'dialogue') {
    if (blank(scene.speaker)) add('speaker', 'Needs a speaker');
    if (scene.lines.length === 0 || scene.lines.some(blank))
      add('lines', 'Needs at least one line, and no empty lines');
    return issues;
  }

  if (blank(scene.prompt)) add('prompt', 'Needs a prompt');
  if (scene.explanation.trim().length <= 20)
    add('explanation', 'Explanation needs more than 20 characters');
  if (scene.explanation.includes('`'))
    add('explanation', 'Explanation can’t contain backticks');
  const docsOk = chapterId === 'apps' && scene.source.startsWith('rayfin-docs:');
  if (!LEARN.test(scene.source) && !docsOk)
    add('source', 'Source must be a https://learn.microsoft.com/ link');
  if (scene.difficulties.length === 0)
    add('difficulties', 'Pick at least one difficulty');

  switch (scene.kind) {
    case 'choice':
    case 'dashboard':
      if (scene.options.length < 2 || scene.options.some(blank))
        add('options', 'Needs at least 2 options, none empty');
      if (dupes(scene.options)) add('options', 'Options must be different');
      if (
        !Number.isInteger(scene.answer) ||
        scene.answer < 0 ||
        scene.answer >= scene.options.length
      )
        add('answer', 'Pick which option is correct');
      if (scene.kind === 'dashboard') {
        const c = scene.chart;
        if (blank(c.title) || blank(c.x) || blank(c.y))
          add('chart', 'Chart needs a title and both axis names');
        if (c.rows.length === 0) add('chart', 'Chart needs at least one row');
        if (
          c.rows.some(
            (r) =>
              blank(String(r[c.x] ?? '')) ||
              typeof r[c.y] !== 'number' ||
              !Number.isFinite(r[c.y])
          )
        )
          add('chart', 'Every bar needs a label and a number');
      }
      break;
    case 'arrange':
      if (scene.items.length < 3 || scene.items.some(blank))
        add('items', 'Needs at least 3 items, none empty');
      if (dupes(scene.items)) add('items', 'Items must be different');
      break;
    case 'match':
      if (scene.pairs.length < 3 || scene.pairs.flat().some(blank))
        add('pairs', 'Needs at least 3 pairs, none empty');
      if (
        dupes(scene.pairs.map((p) => p[0])) ||
        dupes(scene.pairs.map((p) => p[1]))
      )
        add('pairs', 'Each side of the pairs must be different');
      break;
  }
  return issues;
}

/** Everything the game needs from a chapter to be playable. */
export function validateChapter(chapter: Chapter): Issue[] {
  const issues: Issue[] = chapter.scenes.flatMap((s) =>
    validateScene(s, chapter.id)
  );
  const add = (message: string, field?: string) =>
    issues.push({ field, message });

  if (blank(chapter.title) || chapter.title.length > 120)
    add('Title needs 1–120 characters', 'title');
  if (blank(chapter.tagline) || chapter.tagline.length > 200)
    add('Tagline needs 1–200 characters', 'tagline');

  if (dupes(chapter.scenes.map((s) => s.id)))
    add('Two scenes share the same id');

  const { scenes } = chapter;
  const stories = scenes.filter((s) => s.kind === 'dialogue');
  if (
    stories.length !== 2 ||
    scenes[0]?.kind !== 'dialogue' ||
    scenes[scenes.length - 1]?.kind !== 'dialogue'
  )
    add('Needs exactly one Intro story first and one Outro story last');

  for (const d of DIFFICULTIES) {
    const qs = scenes.filter(
      (s) => s.kind !== 'dialogue' && s.difficulties.includes(d)
    );
    if (qs.length < MIN_QUESTIONS_PER_DIFFICULTY)
      add(
        `${label(d)} needs at least ${MIN_QUESTIONS_PER_DIFFICULTY} questions (has ${qs.length})`
      );
    if (!qs.some((s) => s.kind === 'choice'))
      add(`${label(d)} needs a multiple-choice question for the creatures`);
    if (!qs.some((s) => s.kind !== 'choice'))
      add(`${label(d)} needs a puzzle or chart question for the boss`);
  }
  return issues;
}
