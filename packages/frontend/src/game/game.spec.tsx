import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Phaser needs a real canvas/WebGL; the world is replaced by a stub that
// records which worlds are alive and in which mode.
const live = vi.hoisted(() => ({ modes: [] as string[] }));
vi.mock('./rpg/phaser/PhaserGame', async () => {
  const { useEffect } = await import('react');
  return {
    PhaserGame: ({ mode = 'play' }: { mode?: string }) => {
      useEffect(() => {
        live.modes.push(mode);
        return () => {
          live.modes.splice(live.modes.indexOf(mode), 1);
        };
      }, [mode]);
      return <div data-testid="phaser-world" data-mode={mode} />;
    },
  };
});

import { GameApp } from './GameApp';

const click = (name: RegExp | string) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('game flow', () => {
  it('runs the world in attract mode behind the title', () => {
    const { unmount } = render(<GameApp />);
    expect(live.modes).toEqual(['attract']);
    expect(
      screen.getByRole('heading', { name: /fabric quest/i })
    ).toBeInTheDocument();
    unmount();
    expect(live.modes).toEqual([]);
  });

  it('keeps one attract world through difficulty, then swaps in the real world', () => {
    const { unmount } = render(<GameApp />);
    click(/start/i);
    expect(live.modes).toEqual(['attract']);
    click(/beginner/i);
    expect(live.modes).toEqual(['play']);
    expect(
      screen.getByRole('status', { name: /player status/i })
    ).toHaveTextContent(/HP/);
    unmount();
  });

  it('never runs two worlds when visiting the summary and coming back', () => {
    const { unmount } = render(<GameApp />);
    click(/start/i);
    click(/beginner/i);
    click(/summary/i);
    expect(live.modes).toEqual(['attract']);
    expect(screen.getAllByTestId('phaser-world')).toHaveLength(1);
    click(/back to the world/i);
    expect(live.modes).toEqual(['play']);
    expect(screen.getAllByTestId('phaser-world')).toHaveLength(1);
    unmount();
  });
});
