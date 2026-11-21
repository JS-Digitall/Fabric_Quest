import type { RegionId } from './campaign';

/*
 * The world of Fabric: a 96×72 tile map painted from a deterministic layout.
 * A hub village sits in the centre; three regions lie north of it and three south,
 * each joined to the hub by a path.
 */

export const TILE = 16;
export const W = 96;
export const H = 72;

export type TileKind =
  | 'grass'
  | 'path'
  | 'water'
  | 'sand'
  | 'stone'
  | 'wall'
  | 'tree'
  | 'floor'
  | 'lava'
  | 'crystal'
  | 'bridge'
  | 'flowers';

export const LEGEND: Record<string, TileKind> = {
  '.': 'grass',
  '=': 'path',
  '~': 'water',
  ':': 'sand',
  s: 'stone',
  '#': 'wall',
  T: 'tree',
  _: 'floor',
  '^': 'lava',
  '*': 'crystal',
  b: 'bridge',
  ',': 'flowers',
};
const CHAR = Object.fromEntries(
  Object.entries(LEGEND).map(([c, k]) => [k, c])
) as Record<TileKind, string>;

export const SOLID: TileKind[] = ['water', 'wall', 'tree', 'lava', 'crystal'];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Region {
  id: RegionId;
  name: string;
  rect: Rect;
  /** Ground tile, edge tile and the side that faces the hub. */
  ground: TileKind;
  edge: TileKind;
  door: 'top' | 'bottom';
  tint: string;
}

export const HUB: Rect = { x: 38, y: 30, w: 20, h: 12 };

export const REGIONS: Region[] = [
  {
    id: 'onelake',
    name: 'OneLake Shore',
    rect: { x: 4, y: 4, w: 28, h: 23 },
    ground: 'sand',
    edge: 'tree',
    door: 'bottom',
    tint: '#2bc4ad',
  },
  {
    id: 'ingest',
    name: 'Data Factory Foundry',
    rect: { x: 35, y: 4, w: 26, h: 21 },
    ground: 'stone',
    edge: 'wall',
    door: 'bottom',
    tint: '#e09a00',
  },
  {
    id: 'semantic',
    name: 'Semantic Spire',
    rect: { x: 64, y: 4, w: 28, h: 23 },
    ground: 'floor',
    edge: 'crystal',
    door: 'bottom',
    tint: '#6c5ce7',
  },
  {
    id: 'governance',
    name: 'Governance Citadel',
    rect: { x: 4, y: 45, w: 28, h: 23 },
    ground: 'stone',
    edge: 'wall',
    door: 'top',
    tint: '#2d7dd2',
  },
  {
    id: 'fabriciq',
    name: 'IQ Observatory',
    rect: { x: 35, y: 47, w: 26, h: 21 },
    ground: 'floor',
    edge: 'crystal',
    door: 'top',
    tint: '#c2487a',
  },
  {
    id: 'apps',
    name: 'App Forge',
    rect: { x: 64, y: 45, w: 28, h: 23 },
    ground: 'floor',
    edge: 'lava',
    door: 'top',
    tint: '#ef6f52',
  },
];

export const SPAWN = { x: HUB.x + HUB.w / 2, y: HUB.y + HUB.h / 2 };

export interface Spot {
  id: string;
  region: RegionId;
  x: number;
  y: number;
}

const doorX = (r: Region) => r.rect.x + Math.floor(r.rect.w / 2);
const doorY = (r: Region) =>
  r.door === 'bottom' ? r.rect.y + r.rect.h - 1 : r.rect.y;
const inward = (r: Region) => (r.door === 'bottom' ? -1 : 1);
const farY = (r: Region) =>
  r.door === 'bottom' ? r.rect.y + 3 : r.rect.y + r.rect.h - 4;

export const NPCS: Spot[] = REGIONS.map((r) => ({
  id: `npc-${r.id}`,
  region: r.id,
  x: doorX(r) + 2,
  y: doorY(r) + inward(r) * 3,
}));

export const CHESTS: Spot[] = REGIONS.flatMap((r) => [
  { id: `chest-${r.id}-1`, region: r.id, x: r.rect.x + 3, y: farY(r) },
  {
    id: `chest-${r.id}-2`,
    region: r.id,
    x: r.rect.x + r.rect.w - 4,
    y: farY(r),
  },
]);

export const BOSSES: Spot[] = REGIONS.map((r) => ({
  id: `boss-${r.id}`,
  region: r.id,
  x: doorX(r),
  y: farY(r),
}));

// ---------- painting ----------

function paint(): string[] {
  const g: TileKind[][] = Array.from({ length: H }, () =>
    Array<TileKind>(W).fill('grass')
  );
  const set = (x: number, y: number, k: TileKind) => {
    if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = k;
  };
  const fill = (r: Rect, k: TileKind) => {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) set(x, y, k);
  };
  // Cheap deterministic noise for scattering trees and flowers.
  const noise = (x: number, y: number) =>
    ((x * 73856093) ^ (y * 19349663)) % 97;

  // Meadow with tree clumps and flowers, framed by a forest border.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = Math.abs(noise(x, y));
      if (n < 6) set(x, y, 'tree');
      else if (n < 11) set(x, y, 'flowers');
    }
  for (let x = 0; x < W; x++) {
    (set(x, 0, 'tree'),
      set(x, 1, 'tree'),
      set(x, H - 1, 'tree'),
      set(x, H - 2, 'tree'));
  }
  for (let y = 0; y < H; y++) {
    (set(0, y, 'tree'),
      set(1, y, 'tree'),
      set(W - 1, y, 'tree'),
      set(W - 2, y, 'tree'));
  }

  // Hub village: a stone plaza with a flower ring.
  fill({ x: HUB.x - 1, y: HUB.y - 1, w: HUB.w + 2, h: HUB.h + 2 }, 'flowers');
  fill(HUB, 'stone');
  fill({ x: SPAWN.x - 2, y: SPAWN.y - 1, w: 4, h: 2 }, 'path');

  // Paths from the hub to every region door (vertical, horizontal, vertical).
  for (const r of REGIONS) {
    const dx = doorX(r);
    const outside = r.door === 'bottom' ? r.rect.y + r.rect.h : r.rect.y - 1;
    const hubEdge = r.door === 'bottom' ? HUB.y : HUB.y + HUB.h - 1;
    const midY = r.door === 'bottom' ? outside + 1 : outside - 1;
    for (let x = Math.min(dx, SPAWN.x); x <= Math.max(dx, SPAWN.x); x++)
      (set(x, midY, 'path'), set(x, midY + 1, 'path'));
    for (let y = Math.min(outside, midY); y <= Math.max(outside, midY); y++)
      set(dx, y, 'path');
    for (let y = Math.min(midY, hubEdge); y <= Math.max(midY, hubEdge); y++)
      (set(SPAWN.x, y, 'path'), set(SPAWN.x - 1, y, 'path'));
  }

  // Regions: ground, solid edge with a door, then signature decorations.
  for (const r of REGIONS) {
    const { x, y, w, h } = r.rect;
    fill(r.rect, r.edge);
    fill({ x: x + 1, y: y + 1, w: w - 2, h: h - 2 }, r.ground);
    for (let k = -1; k <= 1; k++) set(doorX(r) + k, doorY(r), 'path');

    const cx = x + Math.floor(w / 2);
    const cy = y + Math.floor(h / 2);
    switch (r.id) {
      case 'onelake':
        // The lake itself, crossed by a bridge.
        for (let yy = y + 1; yy < y + h - 1; yy++)
          for (let xx = x + 1; xx < x + w - 1; xx++) {
            const ex = (xx - cx) / 9;
            const ey = (yy - cy) / 5;
            if (ex * ex + ey * ey < 1) set(xx, yy, 'water');
          }
        for (let yy = cy - 6; yy <= cy + 6; yy++)
          (set(cx, yy, 'bridge'), set(cx - 1, yy, 'bridge'));
        break;
      case 'ingest':
        // Foundry pillars: rows of walls with gaps.
        for (let xx = x + 3; xx < x + w - 3; xx += 4) {
          for (let yy = y + 5; yy < y + h - 6; yy++)
            if ((yy - y) % 5 !== 0) set(xx, yy, 'wall');
        }
        for (let yy = y + 1; yy < y + h - 1; yy++) set(cx, yy, 'path');
        break;
      case 'semantic':
        // Crystal grid: a star schema of pillars.
        for (let yy = y + 5; yy < y + h - 5; yy += 3)
          for (let xx = x + 4; xx < x + w - 4; xx += 4)
            if (Math.abs(xx - cx) > 1) set(xx, yy, 'crystal');
        break;
      case 'governance':
        // Citadel courtyard walls with gates.
        for (let xx = x + 3; xx < x + w - 3; xx++) {
          if (Math.abs(xx - cx) > 1) set(xx, cy - 3, 'wall');
          if (Math.abs(xx - cx) > 1 && Math.abs(xx - (x + 5)) > 1)
            set(xx, cy + 3, 'wall');
        }
        break;
      case 'fabriciq':
        // Observatory: a ring of crystals around a central lens.
        for (let a = 0; a < 24; a++) {
          const ang = (a / 24) * Math.PI * 2;
          if (a % 6 === 0) continue;
          set(
            Math.round(cx + Math.cos(ang) * 7),
            Math.round(cy + Math.sin(ang) * 5),
            'crystal'
          );
        }
        set(cx, cy, 'crystal');
        break;
      case 'apps':
        // Forge with lava pools — the edges of what's possible.
        for (const [px, py] of [
          [x + 6, cy - 3],
          [x + w - 9, cy - 3],
          [x + 6, cy + 3],
          [x + w - 9, cy + 3],
        ])
          fill({ x: px, y: py, w: 3, h: 2 }, 'lava');
        break;
    }
  }

  // Spots always stand on open ground.
  for (const s of [...NPCS, ...CHESTS, ...BOSSES]) {
    const r = REGIONS.find((rr) => rr.id === s.region)!;
    set(s.x, s.y, r.ground);
  }
  set(SPAWN.x, SPAWN.y, 'path');

  return g.map((row) => row.map((k) => CHAR[k]).join(''));
}

export const MAP: string[] = paint();

export function tileAt(x: number, y: number): TileKind | null {
  const row = MAP[y];
  if (!row || x < 0 || x >= row.length) return null;
  return LEGEND[row[x]];
}

export function walkable(x: number, y: number): boolean {
  const k = tileAt(x, y);
  return k !== null && !SOLID.includes(k);
}

const inRect = (x: number, y: number, r: Rect) =>
  x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

export function regionAt(x: number, y: number): RegionId | 'hub' | null {
  if (inRect(x, y, HUB)) return 'hub';
  return REGIONS.find((r) => inRect(x, y, r.rect))?.id ?? null;
}

let reachCache: Set<string> | null = null;
function reachable(): Set<string> {
  if (reachCache) return reachCache;
  const seen = new Set([`${SPAWN.x},${SPAWN.y}`]);
  const queue = [SPAWN];
  while (queue.length) {
    const p = queue.shift()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const key = `${nx},${ny}`;
      if (!seen.has(key) && walkable(nx, ny)) {
        seen.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return (reachCache = seen);
}

/** Deterministic, evenly spread creature tiles inside a region. */
export function creatureSpots(region: RegionId, count: number): Spot[] {
  const r = REGIONS.find((rr) => rr.id === region)!;
  const reach = reachable();
  const taken = new Set(
    [...NPCS, ...CHESTS, ...BOSSES].map((s) => `${s.x},${s.y}`)
  );
  const near = (x: number, y: number) =>
    [...NPCS, ...CHESTS, ...BOSSES].some(
      (s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 3
    );
  const doorDist = (y: number) => Math.abs(y - doorY(r));
  const candidates: { x: number; y: number }[] = [];
  for (let y = r.rect.y + 1; y < r.rect.y + r.rect.h - 1; y++)
    for (let x = r.rect.x + 1; x < r.rect.x + r.rect.w - 1; x++) {
      const key = `${x},${y}`;
      if (reach.has(key) && !taken.has(key) && !near(x, y) && doorDist(y) > 3)
        candidates.push({ x, y });
    }
  const step = candidates.length / count;
  return Array.from({ length: Math.min(count, candidates.length) }, (_, i) => {
    const c = candidates[Math.floor(i * step + step / 2)];
    return { id: `creature-${region}-${i}`, region, x: c.x, y: c.y };
  });
}
