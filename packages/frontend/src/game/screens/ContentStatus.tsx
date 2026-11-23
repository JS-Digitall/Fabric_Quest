import type { ReactNode } from 'react';

import { chapters as starter } from '../content';
import type { ContentState } from '../content/content-context';
import { PixelButton, PixelWindow } from '../rpg/ui/kit';

/** Title-screen stand-in while questions load or when they can't be played. */
export function ContentStatus({
  state,
  onRetry,
  actions,
}: {
  state: Exclude<ContentState, { status: 'ready' }>;
  onRetry: () => void;
  actions?: ReactNode;
}) {
  return (
    <PixelWindow className="w-full max-w-xl px-600 py-500 text-center">
      {state.status === 'loading' && (
        <p role="status" className="font-pixel text-400">
          Loading the questions…
        </p>
      )}
      {state.status === 'error' && (
        <div role="alert">
          <h2 className="font-pixel text-500 text-[#ffd23f]">
            Couldn’t load the questions
          </h2>
          <p className="mt-300 text-400 text-foreground/90">{state.message}</p>
          <PixelButton className="mt-500 px-600 py-200" onClick={onRetry}>
            Retry
          </PixelButton>
        </div>
      )}
      {state.status === 'invalid' && (
        <div role="alert">
          <h2 className="font-pixel text-500 text-[#ffd23f]">
            Some questions need fixing
          </h2>
          <p className="mt-300 text-400 text-foreground/90">
            An editor needs to fix this before the game can start.
          </p>
          <ul className="mt-400 grid gap-200 text-left">
            {state.errors.map((e) => (
              <li key={e.chapterId}>
                <span className="font-pixel text-400">
                  {state.stored.meta.find((m) => m.chapterId === e.chapterId)
                    ?.title ??
                    starter.find((c) => c.id === e.chapterId)?.title ??
                    e.chapterId}
                </span>
                <span className="block text-300 text-foreground/80">
                  {e.issues[0]?.message}
                </span>
              </li>
            ))}
          </ul>
          {actions}
        </div>
      )}
    </PixelWindow>
  );
}
