import { Gauge, Heart, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { MAX_HP } from '../campaign';
import { H, LEGEND, MAP, REGIONS, W, type TileKind } from '../world';
import { PixelBar, PixelButton, PixelChip, PixelWindow } from './kit';

const MINI: Record<TileKind, string> = {
  grass: '#5fa84f',
  flowers: '#6fb85a',
  path: '#d8c08a',
  sand: '#ecd9a0',
  stone: '#8d96a8',
  floor: '#3a3f63',
  water: '#2f7fd0',
  bridge: '#a0703f',
  wall: '#4b4f5e',
  tree: '#2f6b35',
  lava: '#d9481f',
  crystal: '#9b8cff',
  roof: '#a5442f',
  lamp: '#ffe08a',
  fountain: '#5aa6f0',
};

/** A 2 px-per-tile overview of the world with the player as a blinking dot. */
function Minimap({ pos }: { pos: { x: number; y: number } }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext?.('2d');
    if (!ctx) return;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        ctx.fillStyle = MINI[LEGEND[MAP[y][x]]];
        ctx.fillRect(x * 2, y * 2, 2, 2);
      }
  }, []);
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: W * 2, height: H * 2 }}
    >
      <canvas ref={ref} width={W * 2} height={H * 2} aria-hidden />
      <span
        className="absolute size-[6px] animate-pulse rounded-full bg-white ring-2 ring-black/60"
        style={{ left: pos.x * 2 - 2, top: pos.y * 2 - 2 }}
        aria-hidden
      />
    </div>
  );
}

export function Hud({
  hp,
  score,
  region,
  difficulty,
  fps,
  pos,
  muted,
  onToggleMute,
  onSummary,
}: {
  hp: number;
  score: number;
  region: string | null;
  difficulty: string;
  fps: { fps: number; entities: number } | null;
  pos: { x: number; y: number };
  muted: boolean;
  onToggleMute: () => void;
  onSummary: () => void;
}) {
  const regionName =
    region === 'hub'
      ? 'Hub Village'
      : (REGIONS.find((r) => r.id === region)?.name ?? 'The Wilds');
  const low = hp <= 40;
  return (
    <div className="px-ui pointer-events-none absolute inset-0 flex flex-col justify-between p-400">
      <div className="flex items-start gap-400">
        <PixelWindow
          role="status"
          aria-label="Player status"
          className="pointer-events-auto min-w-[260px] px-300 py-200"
        >
          <p className="font-pixel text-200 uppercase tracking-[0.2em] text-muted-foreground">
            {difficulty} · {regionName}
          </p>
          <div className="mt-100 flex items-center gap-300">
            <Heart
              className={cn(
                'icon-size-300 shrink-0',
                low ? 'text-[#ff7a5c]' : 'text-[#ff7aa8]'
              )}
              aria-hidden
            />
            <div className="flex-1">
              <PixelBar
                label="HP"
                value={hp}
                max={MAX_HP}
                color={low ? '#ff7a5c' : '#4fe08f'}
              />
            </div>
            <span className="self-end font-pixel text-500 leading-500 text-[#ffd23f] [text-shadow:2px_2px_0_#0b1224]">
              {score}
              <span className="ml-100 text-200 text-muted-foreground">pts</span>
            </span>
          </div>
        </PixelWindow>
        <div className="pointer-events-auto ml-auto flex items-start gap-300">
          <PixelButton
            variant="ghost"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="px-300"
          >
            {muted ? (
              <VolumeX className="icon-size-300" aria-hidden />
            ) : (
              <Volume2 className="icon-size-300" aria-hidden />
            )}
          </PixelButton>
          <PixelButton onClick={onSummary}>
            <Trophy className="icon-size-300" aria-hidden /> Summary
          </PixelButton>
        </div>
      </div>
      <div className="flex items-end justify-between gap-400">
        <PixelWindow className="px-300 py-100">
          <p className="font-pixel text-300 text-muted-foreground">
            <span className="text-foreground">WASD</span> /{' '}
            <span className="text-foreground">arrows</span> walk ·{' '}
            <span className="text-foreground">Space</span> talk or open
          </p>
        </PixelWindow>
        <div className="flex flex-col items-end gap-200">
          <span
            title="Live engine stats — this is a Fabric App"
            className="px-ui"
          >
            <PixelChip>
              <Gauge className="icon-size-200 text-[#4fe08f]" aria-hidden />
              {fps ? `${fps.fps} FPS · ${fps.entities} objects` : 'warming up…'}
            </PixelChip>
          </span>
          <PixelWindow className="p-0">
            <Minimap pos={pos} />
          </PixelWindow>
        </div>
      </div>
    </div>
  );
}
