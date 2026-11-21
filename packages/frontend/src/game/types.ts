export type Difficulty = 'beginner' | 'practitioner' | 'expert';

export type ChapterId =
  'onelake' | 'ingest' | 'semantic' | 'governance' | 'fabriciq' | 'apps';

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
  ChoiceScene | ArrangeScene | MatchScene | DashboardScene;
export type Scene = DialogueScene | QuestionScene;

export interface Chapter {
  id: ChapterId;
  title: string;
  tagline: string;
  scenes: Scene[];
}

export type Answer =
  | { kind: 'choice'; index: number }
  | { kind: 'order'; items: string[] }
  | { kind: 'pairs'; pairs: [string, string][] };

export interface ChapterResult {
  score: number;
  max: number;
}

export interface GameState {
  difficulty: Difficulty | null;
  results: Partial<Record<ChapterId, ChapterResult>>;
}
