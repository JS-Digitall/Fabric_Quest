import { useReducer } from 'react';

import { recordResult } from './engine';
import type { ChapterId, Difficulty, GameState } from './types';

export type Screen =
  | { name: 'title' }
  | { name: 'difficulty' }
  | { name: 'map' }
  | { name: 'play'; chapter: ChapterId; run: number }
  | { name: 'result'; chapter: ChapterId }
  | { name: 'summary' };

export interface Game extends GameState {
  screen: Screen;
  runs: number;
}

export type Action =
  | { type: 'go'; screen: Screen['name'] }
  | { type: 'difficulty'; difficulty: Difficulty }
  | { type: 'play'; chapter: ChapterId }
  | { type: 'finish'; chapter: ChapterId; score: number; max: number };

export const initialGame: Game = {
  screen: { name: 'title' },
  difficulty: null,
  results: {},
  runs: 0,
};

export function gameReducer(game: Game, action: Action): Game {
  switch (action.type) {
    case 'go':
      if (action.screen === 'play' || action.screen === 'result') return game;
      return { ...game, screen: { name: action.screen } };
    case 'difficulty':
      // A new difficulty starts a fresh campaign.
      return {
        ...game,
        difficulty: action.difficulty,
        results: {},
        screen: { name: 'map' },
      };
    case 'play':
      // `run` remounts the player so a replay starts clean.
      return {
        ...game,
        runs: game.runs + 1,
        screen: { name: 'play', chapter: action.chapter, run: game.runs + 1 },
      };
    case 'finish':
      return {
        ...game,
        results: recordResult(game, action.chapter, action.score, action.max)
          .results,
        screen: { name: 'result', chapter: action.chapter },
      };
  }
}

export function useGame() {
  return useReducer(gameReducer, initialGame);
}
