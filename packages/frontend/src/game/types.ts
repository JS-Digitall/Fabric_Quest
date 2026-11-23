export type {
  ArrangeScene,
  ArtId,
  Chapter,
  ChapterId,
  ChartData,
  ChoiceScene,
  DashboardScene,
  DialogueScene,
  Difficulty,
  MatchScene,
  QuestionScene,
  Scene,
} from '@rayfin-app/shared';
import type { ChapterId, Difficulty } from '@rayfin-app/shared';

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
