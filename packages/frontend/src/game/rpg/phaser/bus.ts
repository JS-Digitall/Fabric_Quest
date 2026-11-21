import type { RegionId } from '../campaign';

/** Things that happen in the world, sent from Phaser to React. */
export type WorldEvent =
  | { type: 'npc'; id: string; region: RegionId }
  | { type: 'chest'; id: string; region: RegionId }
  | { type: 'creature'; id: string; region: RegionId }
  | { type: 'boss'; region: RegionId }
  | { type: 'region'; region: RegionId | 'hub' | null }
  | { type: 'fps'; fps: number; entities: number }
  | { type: 'step'; x: number; y: number };

/** Commands from React to the Phaser world. */
export type UiCommand =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'remove-creature'; id: string }
  | { type: 'remove-boss'; region: RegionId }
  | { type: 'open-chest'; id: string }
  | { type: 'respawn' }
  | { type: 'fx'; fx: 'hit' | 'heal' | 'victory' };

export interface Bus {
  emit(e: WorldEvent): void;
  on(fn: (e: WorldEvent) => void): () => void;
  send(c: UiCommand): void;
  onCommand(fn: (c: UiCommand) => void): () => void;
}

export function createBus(): Bus {
  const events = new Set<(e: WorldEvent) => void>();
  const commands = new Set<(c: UiCommand) => void>();
  return {
    emit: (e) => events.forEach((fn) => fn(e)),
    on: (fn) => (events.add(fn), () => events.delete(fn)),
    send: (c) => commands.forEach((fn) => fn(c)),
    onCommand: (fn) => (commands.add(fn), () => commands.delete(fn)),
  };
}
