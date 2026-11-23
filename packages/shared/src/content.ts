/** Game content contracts, shared by the game, the editor and the data rows. */
export type Difficulty = 'beginner' | 'practitioner' | 'expert';

export const DIFFICULTIES: readonly Difficulty[] = [
  'beginner',
  'practitioner',
  'expert',
];

/** Fixed: each chapter is a region of the world map, in map order. */
export const CHAPTER_IDS = [
  'onelake',
  'ingest',
  'semantic',
  'governance',
  'fabriciq',
  'apps',
] as const;

export type ChapterId = (typeof CHAPTER_IDS)[number];

/** Key of the illustration registry in `art/`. */
export type ArtId = string;

interface Base {
  id: string;
  difficulties: Difficulty[];
  hint?: string;
  explanation: string;
  /** A learn.microsoft.com URL, or `rayfin-docs:<path>` for installed Rayfin docs. */
  source: string;
}

export interface ChartData {
  title: string;
  x: string;
  y: string;
  rows: Record<string, string | number>[];
}

export type DialogueScene = {
  kind: 'dialogue';
  id: string;
  speaker: string;
  lines: string[];
  art?: ArtId;
};
export type ChoiceScene = Base & {
  kind: 'choice';
  prompt: string;
  options: string[];
  answer: number;
};
/** `items` are in the correct order; the UI shuffles them. */
export type ArrangeScene = Base & {
  kind: 'arrange';
  prompt: string;
  items: string[];
};
/** `pairs` are the correct [left, right] pairs. */
export type MatchScene = Base & {
  kind: 'match';
  prompt: string;
  pairs: [string, string][];
};
export type DashboardScene = Base & {
  kind: 'dashboard';
  prompt: string;
  chart: ChartData;
  options: string[];
  answer: number;
};

export type QuestionScene =
  | ChoiceScene
  | ArrangeScene
  | MatchScene
  | DashboardScene;
export type Scene = DialogueScene | QuestionScene;
export type SceneKind = Scene['kind'];

export const SCENE_KINDS: readonly SceneKind[] = [
  'dialogue',
  'choice',
  'arrange',
  'match',
  'dashboard',
];

export interface Chapter {
  id: ChapterId;
  title: string;
  tagline: string;
  scenes: Scene[];
}
