import { useReducer } from 'react';

import { recordResult } from './engine';
import { newCampaign, type Campaign } from './rpg/campaign';
import type { ChapterId, Difficulty, GameState } from './types';

export type ScreenName = 'title' | 'difficulty' | 'world' | 'summary';

export interface Game extends GameState {
  screen: ScreenName;
  /** Lives here, not in the world view, so leaving the world keeps progress. */
  campaign: Campaign | null;
}

export type Action =
  | { type: 'go'; screen: ScreenName }
  | { type: 'difficulty'; difficulty: Difficulty }
  | { type: 'campaign'; campaign: Campaign }
  | { type: 'finish'; chapter: ChapterId; score: number; max: number };

export const initialGame: Game = {
  screen: 'title',
  difficulty: null,
  results: {},
  campaign: null,
};

export function gameReducer(game: Game, action: Action): Game {
  switch (action.type) {
    case 'go':
      return { ...game, screen: action.screen };
    case 'difficulty':
      // A new difficulty starts a fresh campaign.
      return {
        ...game,
        difficulty: action.difficulty,
        results: {},
        campaign: newCampaign(action.difficulty),
        screen: 'world',
      };
    case 'campaign':
      return { ...game, campaign: action.campaign };
    case 'finish':
      return {
        ...game,
        results: recordResult(game, action.chapter, action.score, action.max)
          .results,
      };
  }
}

export function useGame() {
  return useReducer(gameReducer, initialGame);
}
