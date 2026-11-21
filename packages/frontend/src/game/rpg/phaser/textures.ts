import type Phaser from 'phaser';

import type { RegionId } from '../campaign';
import { LEGEND, REGIONS, TILE, type TileKind } from '../world';

/*
 * All art is drawn here, in code: a 16 px tileset, characters, creatures,
 * bosses and chests. Nothing is loaded from files, so the look is original
 * and the app ships no binary assets.
 */

type Ctx = CanvasRenderingContext2D;

export const TILE_ORDER: TileKind[] = [...new Set(Object.values(LEGEND))];
export const tileIndex = (k: TileKind) => TILE_ORDER.indexOf(k);

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

function drawTile(c: Ctx, ox: number, k: TileKind) {
  const r = speck(ox + 7);
  const dots = (base: string, dot: string, n: number) => {
    px(c, ox, 0, TILE, TILE, base);
    for (let i = 0; i < n; i++)
      px(c, ox + Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, dot);
  };
  switch (k) {
    case 'grass':
      dots('#5fa84f', '#77c062', 14);
      {
        px(c, ox + 4, 5, 1, 2, '#3f8a3a');
        px(c, ox + 11, 10, 1, 2, '#3f8a3a');
      }
      break;
    case 'flowers':
      dots('#5fa84f', '#77c062', 8);
      for (const [x, y, col] of [
        [3, 4, '#ffd23f'],
        [11, 3, '#ff7aa8'],
        [7, 10, '#ffffff'],
        [13, 12, '#ffd23f'],
      ] as const)
        px(c, ox + x, y, 2, 2, col);
      break;
    case 'path':
      dots('#d8c08a', '#c4a872', 18);
      break;
    case 'sand':
      dots('#ecd9a0', '#d9c288', 16);
      break;
    case 'stone':
      px(c, ox, 0, TILE, TILE, '#8d96a8');
      {
        px(c, ox, 7, TILE, 1, '#76808f');
        px(c, ox + 7, 0, 1, 7, '#76808f');
        px(c, ox + 3, 8, 1, 8, '#76808f');
      }
      px(c, ox + 1, 1, 5, 1, '#a3abbb');
      break;
    case 'floor':
      px(c, ox, 0, TILE, TILE, '#3a3f63');
      {
        px(c, ox, 0, TILE, 1, '#4a5080');
        px(c, ox, 0, 1, TILE, '#4a5080');
      }
      px(c, ox + 7, 7, 2, 2, '#5761a0');
      break;
    case 'water':
      px(c, ox, 0, TILE, TILE, '#2f7fd0');
      {
        px(c, ox + 2, 4, 5, 1, '#7fc4ff');
        px(c, ox + 9, 10, 5, 1, '#7fc4ff');
        px(c, ox + 5, 13, 3, 1, '#5aa6f0');
      }
      break;
    case 'bridge':
      px(c, ox, 0, TILE, TILE, '#a0703f');
      for (let y = 0; y < TILE; y += 4) px(c, ox, y, TILE, 1, '#7a5228');
      {
        px(c, ox, 0, 1, TILE, '#5c3c1c');
        px(c, ox + 15, 0, 1, TILE, '#5c3c1c');
      }
      break;
    case 'wall':
      px(c, ox, 0, TILE, TILE, '#4b4f5e');
      for (let y = 0; y < TILE; y += 4) {
        px(c, ox, y, TILE, 1, '#3a3d49');
        px(c, ox + ((y / 4) % 2 ? 4 : 10), y, 1, 4, '#3a3d49');
      }
      px(c, ox + 1, 1, 6, 1, '#646a7e');
      break;
    case 'tree':
      dots('#5fa84f', '#77c062', 6);
      px(c, ox + 7, 11, 2, 5, '#6b4423');
      {
        px(c, ox + 2, 2, 12, 9, '#2f6b35');
        px(c, ox + 4, 1, 8, 1, '#2f6b35');
      }
      {
        px(c, ox + 4, 3, 4, 3, '#4a9447');
        px(c, ox + 9, 6, 3, 2, '#3d8240');
      }
      break;
    case 'lava':
      px(c, ox, 0, TILE, TILE, '#d9481f');
      {
        px(c, ox + 2, 3, 4, 2, '#ffb02e');
        px(c, ox + 9, 9, 5, 2, '#ffb02e');
        px(c, ox + 5, 12, 2, 1, '#ffe08a');
      }
      break;
    case 'crystal':
      px(c, ox, 0, TILE, TILE, '#3a3f63');
      c.fillStyle = '#9b8cff';
      c.beginPath();
      {
        c.moveTo(ox + 8, 1);
        c.lineTo(ox + 13, 7);
        c.lineTo(ox + 8, 15);
        c.lineTo(ox + 3, 7);
        c.closePath();
      }
      c.fill();
      px(c, ox + 7, 3, 1, 6, '#e4ddff');
      break;
  }
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
function drawPerson(c: Ctx, ox: number, p: Palette, dir: number, step: number) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  // shadow
  o(4, 14, 8, 2, 'rgba(0,0,0,0.25)');
  // legs
  const l = step ? 1 : 0;
  {
    o(5, 11 - l, 2, 4 - (1 - l), p.pants);
    o(9, 11 - (1 - l), 2, 4 - l, p.pants);
  }
  // body
  o(4, 7, 8, 5, p.shirt);
  {
    o(3, 8, 1, 3, p.skin);
    o(12, 8, 1, 3, p.skin);
  }
  // head
  o(4, 1, 8, 7, p.skin);
  if (dir === 1) o(4, 1, 8, 6, p.hair);
  else {
    o(4, 1, 8, 2, p.hair);
    if (dir === 0) {
      o(5, 4, 1, 2, '#1d1d2b');
      o(10, 4, 1, 2, '#1d1d2b');
    } else {
      o(4, 1, 3, 5, p.hair);
      o(10, 4, 1, 2, '#1d1d2b');
    }
  }
}

/** A "Data Chaos" blob: rounded body, glitchy stripes, big eyes. */
function drawCreature(c: Ctx, ox: number, color: string, frame: number) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  const b = frame; // bob
  o(3, 14, 10, 2, 'rgba(0,0,0,0.25)');
  o(3, 5 + b, 10, 9 - b, color);
  {
    o(4, 4 + b, 8, 1, color);
    o(2, 7 + b, 1, 6 - b, color);
    o(13, 7 + b, 1, 6 - b, color);
  }
  {
    o(4, 9 + b, 8, 1, 'rgba(255,255,255,0.25)');
    o(5, 11 + b, 6, 1, 'rgba(0,0,0,0.2)');
  }
  {
    o(5, 6 + b, 2, 3, '#ffffff');
    o(9, 6 + b, 2, 3, '#ffffff');
  }
  {
    o(6, 7 + b, 1, 2, '#14213d');
    o(10, 7 + b, 1, 2, '#14213d');
  }
  o(1 + frame * 12, 3, 1, 1, color); // a stray glitch pixel
}

/** A 32 px boss: a crowned chaos block with glowing core. */
function drawBoss(c: Ctx, ox: number, color: string, frame: number) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  const b = frame * 2;
  o(5, 29, 22, 3, 'rgba(0,0,0,0.3)');
  o(4, 8 + b, 24, 21 - b, color);
  {
    o(2, 12 + b, 2, 14 - b, color);
    o(28, 12 + b, 2, 14 - b, color);
  }
  for (let i = 0; i < 5; i++) o(6 + i * 5, 3 + b, 3, 5, '#ffd23f');
  o(4, 8 + b, 24, 2, '#ffd23f');
  {
    o(8, 13 + b, 5, 5, '#ffffff');
    o(19, 13 + b, 5, 5, '#ffffff');
  }
  {
    o(10, 15 + b, 2, 3, '#14213d');
    o(21, 15 + b, 2, 3, '#14213d');
  }
  {
    o(12, 22 + b, 8, 3, '#14213d');
    o(13, 22 + b, 2, 1, '#ffffff');
    o(17, 22 + b, 2, 1, '#ffffff');
  }
  o(14, 19 + b, 4, 2, frame ? '#ffffff' : '#ffd23f');
}

function drawChest(c: Ctx, ox: number, open: boolean) {
  const o = (x: number, y: number, w: number, h: number, col: string) =>
    px(c, ox + x, y, w, h, col);
  o(2, 14, 12, 2, 'rgba(0,0,0,0.25)');
  {
    o(2, 7, 12, 7, '#a0612b');
    o(2, 9, 12, 1, '#ffd23f');
    o(7, 9, 2, 3, '#ffd23f');
  }
  if (open) {
    o(2, 3, 12, 4, '#5c3415');
    o(4, 5, 8, 2, '#ffe08a');
  } else {
    o(2, 4, 12, 4, '#c27a3a');
    o(2, 4, 12, 1, '#e09a50');
  }
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
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < frames; i++) draw(ctx, i);
  const tex = scene.textures.addCanvas(key, canvas)!;
  for (let i = 0; i < frames; i++) tex.add(i, 0, i * frameW, 0, frameW, frameH);
}

export const CREATURE_COLORS: Record<RegionId, string> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r.tint])
) as Record<RegionId, string>;

export function buildTextures(scene: Phaser.Scene) {
  sheet(scene, 'tiles', TILE, TILE, TILE_ORDER.length, (c, i) =>
    drawTile(c, i * TILE, TILE_ORDER[i])
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
  sheet(scene, 'spark', 4, 4, 1, (c) => {
    px(c, 0, 0, 4, 4, '#ffffff');
  });
}
