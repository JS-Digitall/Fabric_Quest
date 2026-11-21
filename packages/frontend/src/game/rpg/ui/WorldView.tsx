import { useEffect, useMemo, useState } from 'react';

import { chapters } from '../../content';
import type { ChapterId, ChapterResult } from '../../types';
import { poolFor, type Campaign, type RegionId } from '../campaign';
import { createBus } from '../phaser/bus';
import { PhaserGame } from '../phaser/PhaserGame';
import { REGIONS, SPAWN, creatureSpots } from '../world';
import { Hud } from './Hud';

export interface WorldViewProps {
  campaign: Campaign;
  onCampaign: (c: Campaign) => void;
  onResult: (chapter: ChapterId, r: ChapterResult) => void;
  onSummary: () => void;
  onChangeDifficulty: () => void;
}

/** One creature per creature question for the difficulty, minus those already met. */
export function livingCreatures(c: Campaign) {
  return REGIONS.flatMap((r) => {
    const chapter = chapters.find((ch) => ch.id === r.id)!;
    return creatureSpots(r.id, poolFor(chapter, c.difficulty).choice.length);
  }).filter((s) => !c.defeatedCreatures.includes(s.id));
}

export function WorldView({ campaign, onSummary }: WorldViewProps) {
  const bus = useMemo(() => createBus(), []);
  // Snapshot for building the world; later changes travel as bus commands.
  const [initial] = useState(() => ({
    creatures: livingCreatures(campaign),
    openedChests: campaign.openedChests,
    defeatedBosses: campaign.bossesDefeated,
  }));
  const [region, setRegion] = useState<RegionId | 'hub' | null>('hub');
  const [fps, setFps] = useState<{ fps: number; entities: number } | null>(
    null
  );
  const [pos, setPos] = useState(SPAWN);
  const [muted, setMuted] = useState(true);

  useEffect(
    () =>
      bus.on((e) => {
        if (e.type === 'region') setRegion(e.region);
        else if (e.type === 'fps') setFps({ fps: e.fps, entities: e.entities });
        else if (e.type === 'step') setPos({ x: e.x, y: e.y });
      }),
    [bus]
  );

  const score = Object.values(campaign.answered).reduce((s, p) => s + p, 0);

  return (
    <div className="relative h-full w-full">
      <PhaserGame bus={bus} {...initial} />
      <Hud
        hp={campaign.hp}
        score={score}
        region={region}
        difficulty={campaign.difficulty}
        fps={fps}
        pos={pos}
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
        onSummary={onSummary}
      />
    </div>
  );
}
