import { describe, expect, it } from 'vitest';

import {
  BOSSES,
  CHESTS,
  HUB,
  LEGEND,
  MAP,
  NPCS,
  REGIONS,
  SPAWN,
  creatureSpots,
  regionAt,
  walkable,
} from './world';

function reachableSet() {
  const seen = new Set<string>([`${SPAWN.x},${SPAWN.y}`]);
  const queue = [SPAWN];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: x + dx, y: y + dy };
      const key = `${n.x},${n.y}`;
      if (!seen.has(key) && walkable(n.x, n.y)) {
        seen.add(key);
        queue.push(n);
      }
    }
  }
  return seen;
}

const reach = reachableSet();
const inRect = (
  s: { x: number; y: number },
  r: { x: number; y: number; w: number; h: number }
) => s.x >= r.x && s.x < r.x + r.w && s.y >= r.y && s.y < r.y + r.h;

describe('world map', () => {
  it('is a 96×72 grid of known tiles', () => {
    expect(MAP).toHaveLength(72);
    for (const row of MAP) {
      expect(row).toHaveLength(96);
      for (const ch of row) expect(LEGEND[ch], ch).toBeDefined();
    }
  });

  it('spawns the player on a walkable hub tile', () => {
    expect(walkable(SPAWN.x, SPAWN.y)).toBe(true);
    expect(regionAt(SPAWN.x, SPAWN.y)).toBe('hub');
    expect(inRect(SPAWN, HUB)).toBe(true);
  });

  it('treats out-of-bounds as solid', () => {
    expect(walkable(-1, 0)).toBe(false);
    expect(walkable(0, 999)).toBe(false);
  });

  it('has six regions, each with one NPC, two chests and one boss inside it', () => {
    expect(REGIONS.map((r) => r.id).sort()).toEqual([
      'apps',
      'fabriciq',
      'governance',
      'ingest',
      'onelake',
      'semantic',
    ]);
    for (const r of REGIONS) {
      expect(
        NPCS.filter((s) => s.region === r.id && inRect(s, r.rect))
      ).toHaveLength(1);
      expect(
        CHESTS.filter((s) => s.region === r.id && inRect(s, r.rect))
      ).toHaveLength(2);
      expect(
        BOSSES.filter((s) => s.region === r.id && inRect(s, r.rect))
      ).toHaveLength(1);
      expect(regionAt(r.rect.x + 2, r.rect.y + 2)).toBe(r.id);
    }
  });

  it('can reach every NPC, chest and boss from the spawn', () => {
    for (const s of [...NPCS, ...CHESTS, ...BOSSES]) {
      expect(walkable(s.x, s.y), s.id).toBe(true);
      expect(reach.has(`${s.x},${s.y}`), s.id).toBe(true);
    }
  });

  it('places distinct reachable creature spots inside a region', () => {
    for (const r of REGIONS) {
      const spots = creatureSpots(r.id, 8);
      expect(spots).toHaveLength(8);
      expect(new Set(spots.map((s) => `${s.x},${s.y}`)).size).toBe(8);
      for (const s of spots) {
        expect(inRect(s, r.rect), s.id).toBe(true);
        expect(reach.has(`${s.x},${s.y}`), s.id).toBe(true);
      }
      expect(creatureSpots(r.id, 8)).toEqual(spots);
    }
  });

  it('keeps creatures off NPC, chest and boss tiles', () => {
    const taken = new Set(
      [...NPCS, ...CHESTS, ...BOSSES].map((s) => `${s.x},${s.y}`)
    );
    for (const r of REGIONS)
      for (const s of creatureSpots(r.id, 8))
        expect(taken.has(`${s.x},${s.y}`)).toBe(false);
  });
});
