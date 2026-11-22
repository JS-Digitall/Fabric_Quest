import type Phaser from 'phaser';

import type { RegionId } from '../campaign';
import { LEGEND, REGIONS, TILE, type TileKind } from '../world';

/*
 * All art is drawn here, in code: a 16 px tileset with variants and animation
 * frames, outlined characters, creatures, bosses, chests and effect textures.
 * Nothing is loaded from files, so the look is original and the app ships no
 * binary assets.
 */

type Ctx = CanvasRenderingContext2D;

export const TILE_ORDER: TileKind[] = [...new Set(Object.values(LEGEND))];
export const tileIndex = (k: TileKind) => TILE_ORDER.indexOf(k);

// Extra tile frames after the base kinds: look variants and animation frames.
const EXTRA = [
  ['grass', 1],
  ['grass', 2],
  ['stone', 1],
  ['floor', 1],
  ['sand', 1],
  ['water', 1],
  ['lava', 1],
] as const;
const extraIndex = (k: TileKind, v: number) =>
  TILE_ORDER.length + EXTRA.findIndex(([ek, ev]) => ek === k && ev === v);
const TILE_COUNT = TILE_ORDER.length + EXTRA.length;

const VARIANTS: Partial<Record<TileKind, number>> = {
  grass: 3,
  stone: 2,
  floor: 2,
  sand: 2,
};

/** The tile frame to draw at (x, y): a stable look variant for ground tiles. */
export function tileFrame(k: TileKind, x: number, y: number): number {
  const n = VARIANTS[k] ?? 1;
  const v = Math.abs((x * 7919) ^ (y * 104729)) % n;
  return v === 0 ? tileIndex(k) : extraIndex(k, v);
}

/** Tiles that swap between two frames: [frame A, frame B]. */
export const ANIMATED: [number, number][] = (
  ['water', 'lava'] as TileKind[]
).map((k) => [tileIndex(k), extraIndex(k, 1)]);

/** Every frame index that collides (base solid kinds plus their animation frames). */
export function solidFrames(solid: TileKind[]): number[] {
  return [
    ...solid.map(tileIndex),
    ...EXTRA.filter(([k]) => solid.includes(k)).map(([k, v]) =>
      extraIndex(k, v)
    ),
  ];
}

const px = (
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};

// Deterministic speckle so tiles look hand-made but stable.
const speck = (seed: number) => {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
};

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.max(
      0,
      Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))
    );
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function drawTile(c: Ctx, ox: number, k: TileKind, v: number) {
  const r = speck(ox * 13 + v * 101 + 7);
  const dots = (base: string, dot: string, n: number) => {
    px(c, ox, 0, TILE, TILE, base);
    for (let i = 0; i < n; i++)
      px(c, ox + Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, dot);
  };
  const grass = (n = 14) => {
    dots('#5ea94e', '#74c060', n);
    for (let i = 0; i < 4 + v * 2; i++) {
      const x = Math.floor(r() * 14);
      const y = Math.floor(r() * 13) + 1;
      px(c, ox + x, y, 1, 2, '#3e8a38');
      px(c, ox + x + 1, y + 1, 1, 1, '#3e8a38');
    }
  };
  switch (k) {
    case 'grass':
      grass();
      if (v === 2) px(c, ox + 6, 7, 2, 1, '#9bd47a');
      break;
    case 'flowers':
      grass(8);
      for (const [x, y, col] of [
        [3, 4, '#ffd23f'],
        [11, 3, '#ff7aa8'],
        [7, 10, '#ffffff'],
        [13, 12, '#ffd23f'],
      ] as const) {
        px(c, ox + x, y, 2, 2, col);
        px(c, ox + x, y + 2, 1, 1, '#3e8a38');
      }
      break;
    case 'path':
      dots('#d9c18b', '#c4a872', 18);
      px(c, ox, 0, TILE, 1, '#e6d3a4');
      break;
    case 'sand':
      dots('#ecd9a0', '#d8c085', 16);
      if (v) px(c, ox + 4, 9, 3, 1, '#f6e8bf');
      break;
    case 'stone':
      px(c, ox, 0, TILE, TILE, '#8e97a9');
      // Flagstones: highlight on top-left edges, shadow on bottom-right.
      for (const [x, y, w, h] of v
        ? [
            [0, 0, 9, 7],
            [9, 0, 7, 7],
            [0, 7, 5, 9],
            [5, 7, 11, 9],
          ]
        : [
            [0, 0, 7, 7],
            [7, 0, 9, 7],
            [0, 7, 11, 9],
            [11, 7, 5, 9],
          ]) {
        px(c, ox + x, y, w, 1, '#a7afbf');
        px(c, ox + x, y, 1, h, '#a7afbf');
        px(c, ox + x, y + h - 1, w, 1, '#737c8d');
        px(c, ox + x + w - 1, y, 1, h, '#737c8d');
      }
      break;
    case 'floor':
      px(c, ox, 0, TILE, TILE, '#383d61');
      px(c, ox, 0, TILE, 1, '#4b5283');
      px(c, ox, 0, 1, TILE, '#4b5283');
      px(c, ox, 15, TILE, 1, '#2b2f4c');
      px(c, ox + 15, 0, 1, TILE, '#2b2f4c');
      if (v) px(c, ox + 6, 6, 4, 4, '#454b78');
      else px(c, ox + 7, 7, 2, 2, '#5761a0');
      break;
    case 'water': {
      px(c, ox, 0, TILE, TILE, '#2a74c4');
      px(c, ox, 0, TILE, 2, '#3a86d4');
      const s = v ? 3 : 0;
      px(c, ox + ((2 + s) % 12), 4, 5, 1, '#8fd0ff');
      px(c, ox + ((9 + s) % 12), 10, 4, 1, '#8fd0ff');
      px(c, ox + ((5 + s) % 12), 13, 3, 1, '#5aa6f0');
      break;
    }
    case 'bridge':
      px(c, ox, 0, TILE, TILE, '#a5733f');
      for (let y = 0; y < TILE; y += 4) {
        px(c, ox, y, TILE, 1, '#7a5228');
        px(c, ox, y + 1, TILE, 1, '#bd8a52');
      }
      px(c, ox, 0, 2, TILE, '#5c3c1c');
      px(c, ox + 14, 0, 2, TILE, '#5c3c1c');
      break;
    case 'wall':
      px(c, ox, 0, TILE, TILE, '#4b4f60');
      for (let y = 0; y < TILE; y += 4) {
        px(c, ox, y, TILE, 1, '#5d6276');
        px(c, ox, y + 3, TILE, 1, '#383b48');
        px(c, ox + ((y / 4) % 2 ? 4 : 10), y, 1, 4, '#383b48');
      }
      break;
    case 'tree':
      grass(6);
      px(c, ox + 3, 13, 10, 2, 'rgba(0,0,0,0.25)');
      px(c, ox + 7, 10, 2, 5, '#6b4423');
      px(c, ox + 7, 10, 1, 5, '#80552d');
      // Canopy: outline, base, shade, highlight.
      px(c, ox + 2, 2, 12, 9, '#1d4a26');
      px(c, ox + 4, 1, 8, 1, '#1d4a26');
      px(c, ox + 3, 2, 10, 8, '#2f7a3a');
      px(c, ox + 3, 8, 10, 2, '#256330');
      px(c, ox + 4, 3, 5, 3, '#4fa452');
      px(c, ox + 5, 3, 2, 1, '#7cc874');
      break;
    case 'lava': {
      px(c, ox, 0, TILE, TILE, '#c63c19');
      const s = v ? 2 : 0;
      px(c, ox + 2 + s, 3, 4, 2, '#ffb02e');
      px(c, ox + 9 - s, 9, 5, 2, '#ffb02e');
      px(c, ox + 5 + s, 12, 2, 1, '#ffe08a');
      px(c, ox + 3, 7 + s, 1, 1, '#ffe08a');
      break;
    }
    case 'crystal':
      px(c, ox, 0, TILE, TILE, '#383d61');
      c.fillStyle = '#5b4bc4';
      c.beginPath();
      c.moveTo(ox + 8, 0);
      c.lineTo(ox + 14, 7);
      c.lineTo(ox + 8, 16);
      c.lineTo(ox + 2, 7);
      c.closePath();
      c.fill();
      c.fillStyle = '#a99bff';
      c.beginPath();
      c.moveTo(ox + 8, 1);
      c.lineTo(ox + 13, 7);
      c.lineTo(ox + 8, 15);
      c.lineTo(ox + 3, 7);
      c.closePath();
      c.fill();
      px(c, ox + 8, 3, 3, 9, '#7d6cf0');
      px(c, ox + 6, 3, 1, 6, '#f0ebff');
      break;
    case 'roof':
      px(c, ox, 0, TILE, TILE, '#a5442f');
      for (let y = 2; y < TILE; y += 4) {
        px(c, ox, y, TILE, 1, '#7d2f20');
        for (let x = (y / 2) % 4; x < TILE; x += 4)
          px(c, ox + x, y - 2, 1, 2, '#7d2f20');
      }
      px(c, ox, 0, TILE, 1, '#d9694c');
      px(c, ox, 15, TILE, 1, '#5a1f15');
      break;
    case 'lamp':
      px(c, ox, 0, TILE, TILE, '#8e97a9');
      px(c, ox + 4, 13, 8, 2, 'rgba(0,0,0,0.3)');
      px(c, ox + 7, 5, 2, 9, '#2b2f3e');
      px(c, ox + 5, 13, 6, 2, '#2b2f3e');
      px(c, ox + 5, 1, 6, 5, '#2b2f3e');
      px(c, ox + 6, 2, 4, 3, '#ffe08a');
      px(c, ox + 7, 2, 1, 1, '#ffffff');
      break;
    case 'fountain':
      // Plain plaza under the 32 px fountain sprite the scene places on top.
      px(c, ox, 0, TILE, TILE, '#8e97a9');
      break;
  }
}

/** The hub fountain as one 32 px sprite: stone basin, rippling water, a jet. */
function drawFountain(c: Ctx, ox: number, frame: number) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  o(2, 6, 28, 24, '#6f788a');
  o(1, 9, 30, 18, '#6f788a');
  o(3, 7, 26, 22, '#b4bccb');
  o(5, 10, 22, 16, '#2a74c4');
  o(5, 10, 22, 2, '#1d5aa0');
  const s = frame * 3;
  o(8 + s, 15, 5, 1, '#8fd0ff');
  o(17 - s, 20, 5, 1, '#8fd0ff');
  o(10, 23, 4, 1, '#5aa6f0');
  // Centre column and water jet.
  o(14, 9, 4, 10, '#8e97a9');
  o(14, 9, 1, 10, '#b4bccb');
  o(15, 1, 2, 9 - frame, '#8fd0ff');
  o(13, 1 + frame, 1, 3, '#cdeaff');
  o(18, 2 - frame + 1, 1, 3, '#cdeaff');
  o(15, 0 + frame, 2, 1, '#ffffff');
  outline(c, ox, 32, 32);
}

/** Give everything drawn in a frame a 1 px dark outline (classic sprite look). */
function outline(c: Ctx, x0: number, w: number, h: number, color = '#120d1c') {
  if (!c.getImageData) return;
  const img = c.getImageData(x0, 0, w, h);
  const a = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? 0 : img.data[(y * w + x) * 4 + 3];
  c.fillStyle = color;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (
        a(x, y) === 0 &&
        (a(x - 1, y) > 200 ||
          a(x + 1, y) > 200 ||
          a(x, y - 1) > 200 ||
          a(x, y + 1) > 200)
      )
        c.fillRect(x0 + x, y, 1, 1);
}

export interface Palette {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
}

export const PLAYER_PALETTE: Palette = {
  skin: '#f2c9a0',
  hair: '#2b2140',
  shirt: '#2bc4ad',
  pants: '#2c3e66',
};
export const NPC_PALETTES: Record<RegionId, Palette> = {
  onelake: {
    skin: '#e8b48a',
    hair: '#7a3b1f',
    shirt: '#f2a900',
    pants: '#3b3b58',
  },
  ingest: {
    skin: '#c98d62',
    hair: '#1d1d1d',
    shirt: '#ef6f52',
    pants: '#2c3e66',
  },
  semantic: {
    skin: '#f2c9a0',
    hair: '#5a2d82',
    shirt: '#6c5ce7',
    pants: '#1f2a44',
  },
  governance: {
    skin: '#8d5a3b',
    hair: '#111111',
    shirt: '#2d7dd2',
    pants: '#2b2b2b',
  },
  fabriciq: {
    skin: '#f0d0b0',
    hair: '#c94f7c',
    shirt: '#c2487a',
    pants: '#2c3e66',
  },
  apps: {
    skin: '#e8b48a',
    hair: '#3d2b1f',
    shirt: '#ffffff',
    pants: '#14213d',
  },
};

/** Person frame: dir 0 = down, 1 = up, 2 = side; step 0/1 alternates legs. */
export function drawPerson(
  c: Ctx,
  ox: number,
  p: Palette,
  dir: number,
  step: number
) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  const l = step ? 1 : 0;
  // Legs and shoes.
  o(5, 11, 2, 3 - l, p.pants);
  o(9, 11, 2, 2 + l, p.pants);
  o(5, 14 - l, 2, 1, '#2a1d16');
  o(9, 13 + l, 2, 1, '#2a1d16');
  // Body with shading and a belt.
  o(4, 7, 8, 4, p.shirt);
  o(4, 10, 8, 1, shade(p.shirt, -0.35));
  o(10, 7, 2, 3, shade(p.shirt, -0.2));
  o(5, 7, 2, 1, shade(p.shirt, 0.3));
  o(3, 8, 1, 3, p.skin);
  o(12, 8, 1, 3, p.skin);
  // Head.
  o(4, 1, 8, 6, p.skin);
  o(10, 4, 2, 3, shade(p.skin, -0.12));
  if (dir === 1) {
    o(4, 1, 8, 5, p.hair);
    o(5, 1, 3, 1, shade(p.hair, 0.35));
  } else {
    o(4, 1, 8, 2, p.hair);
    o(5, 1, 3, 1, shade(p.hair, 0.35));
    if (dir === 0) {
      o(4, 3, 1, 2, p.hair);
      o(11, 3, 1, 2, p.hair);
      o(5, 4, 1, 2, '#1d1d2b');
      o(10, 4, 1, 2, '#1d1d2b');
      o(7, 6, 2, 1, shade(p.skin, -0.3));
    } else {
      o(4, 1, 3, 5, p.hair);
      o(10, 4, 1, 2, '#1d1d2b');
    }
  }
  outline(c, ox, 16, 16);
}

/** A "Data Chaos" blob: glossy rounded body, shaded belly, big eyes. */
export function drawCreature(c: Ctx, ox: number, color: string, frame: number) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  const b = frame; // squash on the beat
  o(3, 5 + b, 10, 10 - b, color);
  o(4, 4 + b, 8, 1, color);
  o(2, 7 + b, 1, 7 - b, color);
  o(13, 7 + b, 1, 7 - b, color);
  o(3, 12, 11, 3, shade(color, -0.3));
  o(4, 5 + b, 3, 2, shade(color, 0.45));
  o(4, 5 + b, 1, 1, '#ffffff');
  o(5, 7 + b, 2, 3, '#ffffff');
  o(9, 7 + b, 2, 3, '#ffffff');
  o(6, 8 + b, 1, 2, '#14213d');
  o(10, 8 + b, 1, 2, '#14213d');
  o(7, 11 + b, 2, 1, shade(color, -0.55));
  outline(c, ox, 16, 16);
}

/** A 32 px boss: a crowned chaos block with a glowing core. */
export function drawBoss(c: Ctx, ox: number, color: string, frame: number) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  const b = frame * 2;
  o(4, 9 + b, 24, 21 - b, color);
  o(2, 13 + b, 2, 14 - b, color);
  o(28, 13 + b, 2, 14 - b, color);
  o(4, 25, 24, 5, shade(color, -0.3));
  o(6, 11 + b, 6, 3, shade(color, 0.4));
  // Crown with a gem.
  o(5, 7 + b, 22, 3, '#ffd23f');
  o(5, 9 + b, 22, 1, '#c99a12');
  for (let i = 0; i < 5; i++) o(6 + i * 5, 3 + b, 3, 4, '#ffd23f');
  o(15, 7 + b, 2, 2, '#ef3e6b');
  o(15, 7 + b, 1, 1, '#ffffff');
  // Face.
  o(8, 14 + b, 5, 5, '#ffffff');
  o(19, 14 + b, 5, 5, '#ffffff');
  o(10, 16 + b, 2, 3, '#14213d');
  o(21, 16 + b, 2, 3, '#14213d');
  o(12, 23 + b, 8, 3, '#14213d');
  o(13, 23 + b, 2, 1, '#ffffff');
  o(17, 23 + b, 2, 1, '#ffffff');
  o(14, 20 + b, 4, 2, frame ? '#ffffff' : '#ffd23f');
  outline(c, ox, 32, 32);
}

function drawChest(c: Ctx, ox: number, open: boolean) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  o(2, 7, 12, 7, '#9b5a26');
  o(2, 12, 12, 2, '#7a4219');
  o(2, 9, 12, 1, '#ffd23f');
  o(4, 7, 1, 7, '#7a4219');
  o(11, 7, 1, 7, '#7a4219');
  o(7, 9, 2, 3, '#ffd23f');
  o(7, 10, 2, 1, '#8a5f00');
  if (open) {
    o(2, 3, 12, 4, '#5c3415');
    o(4, 5, 8, 2, '#ffe08a');
    o(6, 4, 2, 1, '#ffffff');
  } else {
    o(2, 4, 12, 3, '#c27a3a');
    o(2, 4, 12, 1, '#e3a060');
  }
  outline(c, ox, 16, 16);
}

function sheet(
  scene: Phaser.Scene,
  key: string,
  frameW: number,
  frameH: number,
  frames: number,
  draw: (c: Ctx, i: number) => void
) {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  canvas.width = frameW * frames;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < frames; i++) draw(ctx, i);
  const tex = scene.textures.addCanvas(key, canvas)!;
  for (let i = 0; i < frames; i++) tex.add(i, 0, i * frameW, 0, frameW, frameH);
}

export const CREATURE_COLORS: Record<RegionId, string> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r.tint])
) as Record<RegionId, string>;

export function buildTextures(scene: Phaser.Scene) {
  sheet(scene, 'tiles', TILE, TILE, TILE_COUNT, (c, i) =>
    i < TILE_ORDER.length
      ? drawTile(c, i * TILE, TILE_ORDER[i], 0)
      : drawTile(
          c,
          i * TILE,
          EXTRA[i - TILE_ORDER.length][0],
          EXTRA[i - TILE_ORDER.length][1]
        )
  );
  // Person sheets: frames 0-1 down, 2-3 up, 4-5 side.
  const person = (key: string, p: Palette) =>
    sheet(scene, key, 16, 16, 6, (c, i) =>
      drawPerson(c, i * 16, p, Math.floor(i / 2), i % 2)
    );
  person('player', PLAYER_PALETTE);
  for (const r of REGIONS) {
    person(`npc-${r.id}`, NPC_PALETTES[r.id]);
    sheet(scene, `creature-${r.id}`, 16, 16, 2, (c, i) =>
      drawCreature(c, i * 16, r.tint, i)
    );
    sheet(scene, `boss-${r.id}`, 32, 32, 2, (c, i) =>
      drawBoss(c, i * 32, r.tint, i)
    );
  }
  sheet(scene, 'chest', 16, 16, 2, (c, i) => drawChest(c, i * 16, i === 1));
  sheet(scene, 'fountain', 32, 32, 2, (c, i) => drawFountain(c, i * 32, i));
  sheet(scene, 'spark', 4, 4, 1, (c) => px(c, 0, 0, 4, 4, '#ffffff'));
  // Soft oval drop shadow placed under every sprite.
  sheet(scene, 'shadow', 14, 5, 1, (c) => {
    px(c, 2, 0, 10, 5, 'rgba(0,0,0,0.28)');
    px(c, 0, 1, 14, 3, 'rgba(0,0,0,0.28)');
  });
  // Soft radial glow for additive light (lava, crystals, lamps).
  sheet(scene, 'glow', 32, 32, 1, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
  // Speech-bubble "!" shown over things you can interact with.
  sheet(scene, 'prompt', 10, 12, 1, (c) => {
    px(c, 1, 0, 8, 9, '#14213d');
    px(c, 2, 1, 6, 7, '#ffffff');
    px(c, 4, 2, 2, 3, '#ef6f52');
    px(c, 4, 6, 2, 1, '#ef6f52');
    px(c, 4, 9, 2, 2, '#14213d');
  });
}
