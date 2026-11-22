import { AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { chapters } from '../../content';
import type {
  Chapter,
  ChapterId,
  ChapterResult,
  DialogueScene,
} from '../../types';
import {
  battleCommands,
  heal,
  isCleared,
  livingCreatures,
  regionResult,
  respawn,
  startBossBattle,
  startCreatureBattle,
  type Battle,
  type Campaign,
  type RegionId,
} from '../campaign';
import { createBus } from '../phaser/bus';
import { createSfx } from '../sound';
import { PhaserGame } from '../phaser/PhaserGame';
import { REGIONS, SPAWN, type Region } from '../world';
import { BattleScreen, type BattleEnd } from './BattleScreen';
import { Hud } from './Hud';
import { ChestCard, DialogueBox, RegionBanner, Toast } from './Overlays';

export interface WorldViewProps {
  campaign: Campaign;
  onCampaign: (c: Campaign) => void;
  onResult: (chapter: ChapterId, r: ChapterResult) => void;
  onSummary: () => void;
  onChangeDifficulty: () => void;
}

const CHEST_HEAL = 40;
const chapterOf = (id: RegionId) => chapters.find((c) => c.id === id)!;
const regionOf = (id: RegionId) => REGIONS.find((r) => r.id === id)!;
const dialogues = (c: Chapter) =>
  c.scenes.filter((s): s is DialogueScene => s.kind === 'dialogue');
const mainSource = (c: Chapter) =>
  c.scenes
    .map((s) => ('source' in s ? s.source : ''))
    .find((s) => s.startsWith('https://')) ?? '';

type Overlay =
  | { kind: 'dialogue'; scene: DialogueScene; region: Region }
  | { kind: 'chest'; chapter: Chapter; healed: number }
  | { kind: 'battle'; chapter: Chapter; battle: Battle; campaign: Campaign }
  | null;

export function WorldView({
  campaign,
  onCampaign,
  onResult,
  onSummary,
}: WorldViewProps) {
  const bus = useMemo(() => createBus(), []);
  // Snapshot for building the world; later changes travel as bus commands.
  const [initial] = useState(() => ({
    creatures: livingCreatures(campaign, chapters),
    openedChests: campaign.openedChests,
    defeatedBosses: campaign.bossesDefeated,
  }));
  const [region, setRegion] = useState<RegionId | 'hub' | null>('hub');
  const [banner, setBanner] = useState<Region | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [fps, setFps] = useState<{ fps: number; entities: number } | null>(
    null
  );
  const [pos, setPos] = useState(SPAWN);
  const [muted, setMuted] = useState(true);
  const sfx = useMemo(() => createSfx(), []);
  const touchedMute = useRef(false);
  useEffect(() => sfx.setMuted(muted), [sfx, muted]);
  // Browsers only allow audio after a gesture: switch sound on with the first key press,
  // unless the player already chose a setting.
  useEffect(() => {
    const first = () => {
      if (!touchedMute.current) setMuted(false);
    };
    window.addEventListener('keydown', first, { once: true });
    return () => window.removeEventListener('keydown', first);
  }, []);

  // The bus handler is registered once; read the latest campaign through a ref.
  const latest = useRef(campaign);
  useEffect(() => {
    latest.current = campaign;
  }, [campaign]);

  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast((t) => (t === text ? null : t)), 2600);
  };

  useEffect(
    () =>
      bus.on((e) => {
        const c = latest.current;
        switch (e.type) {
          case 'region':
            setRegion(e.region);
            if (e.region && e.region !== 'hub') {
              const r = regionOf(e.region);
              setBanner(r);
              setTimeout(() => setBanner((b) => (b === r ? null : b)), 2200);
            }
            break;
          case 'fps':
            setFps({ fps: e.fps, entities: e.entities });
            break;
          case 'step':
            setPos({ x: e.x, y: e.y });
            sfx.play('step');
            break;
          case 'npc': {
            sfx.play('talk');
            const lines = dialogues(chapterOf(e.region));
            const scene = isCleared(c, chapterOf(e.region))
              ? lines[lines.length - 1]
              : lines[0];
            setOverlay({ kind: 'dialogue', scene, region: regionOf(e.region) });
            break;
          }
          case 'chest': {
            if (c.openedChests.includes(e.id))
              return bus.send({ type: 'resume' });
            const next = {
              ...heal(c, CHEST_HEAL),
              openedChests: [...c.openedChests, e.id],
            };
            onCampaign(next);
            sfx.play('heal');
            bus.send({ type: 'open-chest', id: e.id });
            bus.send({ type: 'fx', fx: 'heal' });
            setOverlay({
              kind: 'chest',
              chapter: chapterOf(e.region),
              healed: next.hp - c.hp,
            });
            break;
          }
          case 'creature': {
            const battle = startCreatureBattle(c, chapterOf(e.region), e.id);
            if (!battle) {
              bus.send({ type: 'remove-creature', id: e.id });
              return bus.send({ type: 'resume' });
            }
            sfx.play('select');
            setOverlay({
              kind: 'battle',
              chapter: chapterOf(e.region),
              battle,
              campaign: c,
            });
            break;
          }
          case 'boss': {
            const battle = startBossBattle(c, chapterOf(e.region));
            if (!battle) return bus.send({ type: 'resume' });
            sfx.play('select');
            setOverlay({
              kind: 'battle',
              chapter: chapterOf(e.region),
              battle,
              campaign: c,
            });
            break;
          }
        }
      }),
    [bus, onCampaign, sfx]
  );

  function close() {
    setOverlay(null);
    bus.send({ type: 'resume' });
  }

  function endBattle(
    chapter: Chapter,
    battle: Battle,
    next: Campaign,
    result: BattleEnd
  ) {
    if (result !== 'escaped') onResult(chapter.id, regionResult(next, chapter));
    sfx.play(
      result === 'won' ? 'victory' : result === 'lost' ? 'faint' : 'select'
    );
    // World and campaign stay in step: removals and respawn come from one pure rule.
    battleCommands(battle, next, result).forEach((c) => bus.send(c));
    onCampaign(result === 'lost' ? respawn(next) : next);
    if (result === 'lost') flash('You fainted… the hub healers patch you up.');
    else if (result !== 'escaped')
      bus.send({ type: 'fx', fx: result === 'fled' ? 'hit' : 'victory' });
    if (battle.kind === 'boss' && next.bossesDefeated.includes(chapter.id))
      flash(
        isCleared(next, chapter)
          ? `${regionOf(chapter.id).name} cleared!`
          : 'Boss defeated! Creatures still roam here.'
      );
    close();
  }

  const score = Object.values(campaign.answered).reduce((s, p) => s + p, 0);

  return (
    <div className="relative h-full w-full">
      <PhaserGame bus={bus} {...initial} />
      {/* While a dialog is open the HUD is inert, so Tab stays inside the dialog. */}
      <div inert={overlay !== null}>
        <Hud
          hp={campaign.hp}
          score={score}
          region={region}
          difficulty={campaign.difficulty}
          fps={fps}
          pos={pos}
          muted={muted}
          onToggleMute={() => {
            touchedMute.current = true;
            setMuted((m) => !m);
          }}
          onSummary={onSummary}
        />
      </div>
      <AnimatePresence>
        {banner && !overlay && <RegionBanner key={banner.id} region={banner} />}
        {toast && !overlay && <Toast key={toast} text={toast} />}
        {overlay?.kind === 'dialogue' && (
          <DialogueBox
            key="dialogue"
            scene={overlay.scene}
            region={overlay.region}
            onClose={close}
          />
        )}
        {overlay?.kind === 'chest' && (
          <ChestCard
            key="chest"
            chapter={overlay.chapter}
            source={mainSource(overlay.chapter)}
            healed={overlay.healed}
            onClose={close}
          />
        )}
        {overlay?.kind === 'battle' && (
          <BattleScreen
            key={`battle-${overlay.battle.kind}-${overlay.battle.queue[0].id}`}
            chapter={overlay.chapter}
            campaign={overlay.campaign}
            battle={overlay.battle}
            onEnd={(next, result) =>
              endBattle(overlay.chapter, overlay.battle, next, result)
            }
            onAnswered={(correct) => sfx.play(correct ? 'select' : 'hit')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
