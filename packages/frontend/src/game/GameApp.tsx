import { AnimatePresence, motion } from 'framer-motion';

import { chapters } from './content';
import { ChapterPlayer } from './screens/ChapterPlayer';
import { ChapterMap, ChapterResult, DifficultyScreen, SummaryScreen, TitleScreen } from './screens/menus';
import type { ChapterId } from './types';
import { useGame } from './useGame';

const byId = (id: ChapterId) => chapters.find((c) => c.id === id)!;

export function GameApp() {
  const [game, dispatch] = useGame();
  const { screen } = game;
  const go = (name: 'title' | 'difficulty' | 'map' | 'summary') => dispatch({ type: 'go', screen: name });
  const play = (chapter: ChapterId) => dispatch({ type: 'play', chapter });

  let view;
  if (screen.name === 'title') view = <TitleScreen onStart={() => go('difficulty')} />;
  else if (screen.name === 'difficulty' || !game.difficulty)
    view = <DifficultyScreen onPick={(difficulty) => dispatch({ type: 'difficulty', difficulty })} />;
  else if (screen.name === 'map')
    view = (
      <ChapterMap
        chapters={chapters}
        game={game}
        onPlay={play}
        onSummary={() => go('summary')}
        onChangeDifficulty={() => go('difficulty')}
      />
    );
  else if (screen.name === 'play')
    view = (
      <ChapterPlayer
        key={screen.run}
        chapter={byId(screen.chapter)}
        difficulty={game.difficulty}
        onExit={() => go('map')}
        onFinish={(score, max) => dispatch({ type: 'finish', chapter: screen.chapter, score, max })}
      />
    );
  else if (screen.name === 'result') {
    const i = chapters.findIndex((c) => c.id === screen.chapter);
    view = (
      <ChapterResult
        chapter={chapters[i]}
        result={game.results[screen.chapter]!}
        hasNext={i < chapters.length - 1}
        onReplay={() => play(screen.chapter)}
        onNext={() => play(chapters[i + 1].id)}
        onMap={() => go('map')}
      />
    );
  } else view = <SummaryScreen chapters={chapters} game={game} onMap={() => go('map')} />;

  return (
    <main className="game-backdrop min-h-screen px-500 py-600 text-foreground md:px-800">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen.name === 'play' ? `play-${screen.run}` : screen.name}
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
