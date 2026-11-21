import { AnimatePresence, motion } from 'framer-motion';

import { chapters } from './content';
import { WorldView } from './rpg/ui/WorldView';
import { DifficultyScreen, SummaryScreen, TitleScreen } from './screens/menus';
import { useGame, type ScreenName } from './useGame';

export function GameApp() {
  const [game, dispatch] = useGame();
  const go = (screen: ScreenName) => dispatch({ type: 'go', screen });
  const inWorld = game.screen === 'world' && game.campaign !== null;

  let view;
  if (game.screen === 'title')
    view = <TitleScreen onStart={() => go('difficulty')} />;
  else if (game.screen === 'summary')
    view = (
      <SummaryScreen
        chapters={chapters}
        game={game}
        onBack={() => go('world')}
      />
    );
  else if (inWorld)
    view = (
      <WorldView
        campaign={game.campaign!}
        onCampaign={(campaign) => dispatch({ type: 'campaign', campaign })}
        onResult={(chapter, r) =>
          dispatch({ type: 'finish', chapter, score: r.score, max: r.max })
        }
        onSummary={() => go('summary')}
        onChangeDifficulty={() => go('difficulty')}
      />
    );
  else
    view = (
      <DifficultyScreen
        onPick={(difficulty) => dispatch({ type: 'difficulty', difficulty })}
      />
    );

  return (
    <main
      className={
        inWorld
          ? 'fixed inset-0 overflow-hidden bg-background text-foreground'
          : 'game-backdrop min-h-screen px-500 py-600 text-foreground md:px-800'
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={game.screen}
          className={inWorld ? 'h-full w-full' : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {view}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
