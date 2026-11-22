import Phaser from 'phaser';
import { useEffect, useRef } from 'react';

import type { RegionId } from '../campaign';
import type { Spot } from '../world';
import type { Bus } from './bus';
import { WorldScene } from './WorldScene';

/** Mounts one Phaser game into a div and destroys it on unmount. */
export function PhaserGame({
  bus,
  creatures,
  openedChests,
  defeatedBosses,
  mode = 'play',
}: {
  bus: Bus;
  creatures: Spot[];
  openedChests: string[];
  defeatedBosses: RegionId[];
  mode?: 'play' | 'attract';
}) {
  const host = useRef<HTMLDivElement>(null);
  // The world is built once per mount from the state at that moment; later changes arrive as bus commands.
  const init = useRef({ creatures, openedChests, defeatedBosses, mode });

  useEffect(() => {
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      pixelArt: true,
      backgroundColor: '#0d1424',
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      physics: { default: 'arcade', arcade: { debug: false } },
      banner: false,
      scene: new WorldScene({ bus, ...init.current, reducedMotion }),
    });
    return () => game.destroy(true);
  }, [bus]);

  return (
    <div
      ref={host}
      className="absolute inset-0"
      aria-label="Fabric world"
      role="application"
    />
  );
}
