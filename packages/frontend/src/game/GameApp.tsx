import { AnimatePresence, motion } from 'framer-motion';

import { useContent } from './content/content-context';
import { EditorScreen } from './editor/EditorScreen';
import { useIsEditor } from './editor/useIsEditor';
import { PixelButton } from './rpg/ui/kit';
import { AttractWorld } from './rpg/ui/AttractWorld';
import { WorldView } from './rpg/ui/WorldView';
import { ContentStatus } from './screens/ContentStatus';
import { DifficultyScreen, SummaryScreen, TitleScreen } from './screens/menus';
import { useGame, type ScreenName } from './useGame';

export function GameApp() {
  const [game, dispatch] = useGame();
  const content = useContent();
  const isEditor = useIsEditor();
  const go = (screen: ScreenName) => dispatch({ type: 'go', screen });

  if (content.status === 'ready' && game.screen === 'world' && game.campaign)
    return (
      <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
        <WorldView
          chapters={content.chapters}
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
  let key: string = game.screen;
  // The editor stays open while it reloads content after each save.
  if (game.screen === 'editor' && isEditor)
    view = <EditorScreen onBack={() => go('title')} />;
  else if (content.status !== 'ready') {
    key = `content-${content.status}`;
    view = (
      <ContentStatus
        state={content}
        onRetry={() => void content.reload()}
        actions={
          isEditor && (
            <PixelButton
              className="mt-500 px-600 py-200"
              onClick={() => go('editor')}
            >
              Open the question editor
            </PixelButton>
          )
        }
      />
    );
  } else if (game.screen === 'title')
    view = (
      <TitleScreen
        onStart={() => go('difficulty')}
        onEdit={isEditor ? () => go('editor') : undefined}
      />
    );
  else if (game.screen === 'summary')
    view = (
      <SummaryScreen
        chapters={content.chapters}
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
            key={key}
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
