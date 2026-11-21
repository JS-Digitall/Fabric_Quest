import { Gauge, Heart, Trophy, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { MAX_HP } from '../campaign';
import { H, LEGEND, MAP, REGIONS, W, type TileKind } from '../world';

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
      className="relative overflow-hidden rounded-2xl border-2 border-white/20 shadow-lg"
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
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-400">
      <div className="flex items-start gap-400">
        <div
          role="status"
          aria-label="Player status"
          className="pointer-events-auto rounded-3xl bg-[#0d1424]/80 px-500 py-300 text-white shadow-lg backdrop-blur"
        >
          <p className="text-200 font-semibold uppercase tracking-[0.25em] text-white/60">
            {difficulty} · {regionName}
          </p>
          <div className="mt-200 flex items-center gap-300">
            <Heart
              className={cn(
                'icon-size-300',
                low ? 'animate-pulse text-[#ff7a5c]' : 'text-[#ff7aa8]'
              )}
              aria-hidden
            />
            <span className="font-numeric text-400 font-bold">HP {hp}</span>
            <span className="h-200 w-[120px] overflow-hidden rounded-full bg-white/15">
              <span
                className={cn(
                  'block h-full rounded-full transition-[width] duration-500',
                  low ? 'bg-[#ff7a5c]' : 'bg-[#3ccf7f]'
                )}
                style={{ width: `${(hp / MAX_HP) * 100}%` }}
              />
            </span>
            <span className="ml-200 font-numeric text-400 font-bold text-[#ffd23f]">
              {score} pts
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-start gap-300">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="pointer-events-auto grid size-[44px] place-items-center rounded-2xl bg-[#0d1424]/80 text-white shadow-lg backdrop-blur focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
          >
            {muted ? (
              <VolumeX className="icon-size-300" aria-hidden />
            ) : (
              <Volume2 className="icon-size-300" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={onSummary}
            className="pointer-events-auto inline-flex h-[44px] items-center gap-200 rounded-2xl bg-[#0d1424]/80 px-400 font-semibold text-white shadow-lg backdrop-blur focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
          >
            <Trophy className="icon-size-300 text-[#ffd23f]" aria-hidden />{' '}
            Summary
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between gap-400">
        <p className="rounded-2xl bg-[#0d1424]/70 px-400 py-200 text-300 text-white/80 backdrop-blur">
          WASD / arrows to walk · Space to talk or open
        </p>
        <div className="flex flex-col items-end gap-200">
          <p
            className="inline-flex items-center gap-200 rounded-full bg-[#0d1424]/80 px-300 py-100 font-numeric text-200 text-[#3ccf7f] backdrop-blur"
            title="Live engine stats — this is a Fabric App"
          >
            <Gauge className="icon-size-200" aria-hidden />
            {fps ? `${fps.fps} FPS · ${fps.entities} objects` : 'warming up…'}
          </p>
          <Minimap pos={pos} />
        </div>
      </div>
    </div>
  );
}
