import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../rpg/phaser/PhaserGame', () => ({
  PhaserGame: ({ mode = 'play' }: { mode?: string }) => (
    <div data-testid="phaser-world" data-mode={mode} />
  ),
}));

import { GameApp } from '../GameApp';
import { sceneToRow } from './codec';
import { ContentProvider } from './ContentProvider';
import { chapters } from './index';
import type { StoredContent } from './load';

const governance = chapters.find((c) => c.id === 'governance')!;

describe('content loading in the game', () => {
  it('shows an actionable error and retries on request', async () => {
    const load = vi.fn(async (): Promise<StoredContent> => {
      throw new Error('Forbidden');
    });
    render(
      <ContentProvider load={load}>
        <GameApp />
      </ContentProvider>
    );
    expect(
      await screen.findByText(/couldn’t load the questions/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });

  it('blocks play and names a broken chapter', async () => {
    const rows = governance.scenes
      .filter((s) => s.kind === 'dialogue')
      .map((s, i) => ({ id: `r${i}`, ...sceneToRow('governance', s, i) }));
    render(
      <ContentProvider load={async () => ({ meta: [], rows })}>
        <GameApp />
      </ContentProvider>
    );
    expect(await screen.findByText(governance.title)).toBeInTheDocument();
    expect(
      screen.getByText(/beginner needs at least 4 questions/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /start/i })
    ).not.toBeInTheDocument();
  });

  it('offers Start once the questions are loaded', async () => {
    render(
      <ContentProvider load={async () => ({ meta: [], rows: [] })}>
        <GameApp />
      </ContentProvider>
    );
    expect(
      await screen.findByRole('button', { name: /start/i })
    ).toBeEnabled();
  });
});
