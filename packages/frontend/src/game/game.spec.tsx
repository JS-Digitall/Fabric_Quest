import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Phaser needs a real canvas/WebGL; the world is replaced by a counting stub.
const mounts = vi.hoisted(() => ({ mounted: 0, unmounted: 0 }));
vi.mock('./rpg/phaser/PhaserGame', async () => {
  const { useEffect } = await import('react');
  return {
    PhaserGame: () => {
      useEffect(() => {
        mounts.mounted++;
        return () => {
          mounts.unmounted++;
        };
      }, []);
      return <div data-testid="phaser-world" />;
    },
  };
});

import { GameApp } from './GameApp';

const click = (name: RegExp | string) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('game flow', () => {
  it('goes from title through difficulty into the world with a HUD', () => {
    render(<GameApp />);
    click(/start/i);
    click(/beginner/i);
    expect(screen.getByTestId('phaser-world')).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: /player status/i })
    ).toHaveTextContent(/HP/);
  });

  it('destroys the world when leaving it and builds exactly one on return', () => {
    render(<GameApp />);
    click(/start/i);
    click(/beginner/i);
    const before = { ...mounts };
    click(/summary/i);
    expect(mounts.unmounted).toBe(before.unmounted + 1);
    click(/back to the world/i);
    expect(mounts.mounted).toBe(before.mounted + 1);
    expect(screen.getAllByTestId('phaser-world')).toHaveLength(1);
  });
});
