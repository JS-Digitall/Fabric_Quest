import { AnimatePresence, motion } from 'framer-motion';

import { chapters } from './content';
import { AttractWorld } from './rpg/ui/AttractWorld';
import { WorldView } from './rpg/ui/WorldView';
import { DifficultyScreen, SummaryScreen, TitleScreen } from './screens/menus';
import { useGame, type ScreenName } from './useGame';

export function GameApp() {
  const [game, dispatch] = useGame();
  const go = (screen: ScreenName) => dispatch({ type: 'go', screen });

  if (game.screen === 'world' && game.campaign)
    return (
      <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
        <WorldView
          campaign={game.campaign}
          onCampaign={(campaign) => dispatch({ type: 'campaign', campaign })}
          onResult={(chapter, r) =>
            dispatch({ type: 'finish', chapter, score: r.score, max: r.max })
          }
          onSummary={() => go('summary')}
          onChangeDifficulty={() => go('difficulty')}
        />
      </main>
    );

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
  else
    view = (
      <DifficultyScreen
        onPick={(difficulty) => dispatch({ type: 'difficulty', difficulty })}
      />
    );

  // Menus float over the live world in attract mode (one Phaser instance at a time).
  return (
    <main className="px-ui fixed inset-0 overflow-hidden bg-[#070c18]">
      <AttractWorld />
      <div className="px-backdrop pointer-events-none absolute inset-0" />
      <div className="relative h-full overflow-y-auto px-500 py-600">
        <AnimatePresence mode="wait">
          <motion.div
            key={game.screen}
            className="flex min-h-full items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
          >
            {view}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
