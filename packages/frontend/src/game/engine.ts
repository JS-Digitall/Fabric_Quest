import type {
  Answer,
  Chapter,
  ChapterId,
  Difficulty,
  GameState,
  QuestionScene,
  Scene,
} from './types';

/** Dialogue always plays; questions only for the chosen difficulty. */
export function scenesFor(chapter: Chapter, difficulty: Difficulty): Scene[] {
  return chapter.scenes.filter(
    (s) => s.kind === 'dialogue' || s.difficulties.includes(difficulty)
  );
}

function fraction(scene: QuestionScene, answer: Answer): number {
  switch (scene.kind) {
    case 'choice':
    case 'dashboard':
      return answer.kind === 'choice' && answer.index === scene.answer ? 1 : 0;
    case 'arrange':
      if (answer.kind !== 'order') return 0;
      return (
        scene.items.filter((item, i) => answer.items[i] === item).length /
        scene.items.length
      );
    case 'match': {
      if (answer.kind !== 'pairs') return 0;
      const given = new Map(answer.pairs);
      return (
        scene.pairs.filter(([l, r]) => given.get(l) === r).length /
        scene.pairs.length
      );
    }
  }
}

/** 0..100: full points for a correct first try, halved when a hint was used. */
export function scoreAnswer(
  scene: QuestionScene,
  answer: Answer,
  usedHint: boolean
): number {
  return Math.round(fraction(scene, answer) * 100 * (usedHint ? 0.5 : 1));
}

export function maxScore(scenes: Scene[]): number {
  return scenes.filter((s) => s.kind !== 'dialogue').length * 100;
}

/** A replay replaces the chapter's previous result. */
export function recordResult(
  state: GameState,
  id: ChapterId,
  score: number,
  max: number
): GameState {
  return { ...state, results: { ...state.results, [id]: { score, max } } };
}
