import Phaser from 'phaser';

import type { RegionId } from '../campaign';
import {
  BOSSES,
  CHESTS,
  H,
  MAP,
  LEGEND,
  NPCS,
  SOLID,
  SPAWN,
  TILE,
  W,
  regionAt,
  walkable,
  type Spot,
} from '../world';
import type { Bus, UiCommand } from './bus';
import { buildTextures, tileIndex } from './textures';

export interface WorldInit {
  bus: Bus;
  creatures: Spot[];
  openedChests: string[];
  defeatedBosses: RegionId[];
  reducedMotion: boolean;
}

const SPEED = 88;
const center = (t: number) => t * TILE + TILE / 2;

type Dir = 'down' | 'up' | 'left' | 'right';

export class WorldScene extends Phaser.Scene {
  private init_: WorldInit;
  private player!: Phaser.Physics.Arcade.Sprite;
  private dir: Dir = 'down';
  private keys!: Record<
    | 'up'
    | 'down'
    | 'left'
    | 'right'
    | 'w'
    | 'a'
    | 's'
    | 'd'
    | 'space'
    | 'enter',
    Phaser.Input.Keyboard.Key
  >;
  private creatures = new Map<
    string,
    { sprite: Phaser.Physics.Arcade.Sprite; spot: Spot }
  >();
  private bosses = new Map<RegionId, Phaser.Physics.Arcade.Sprite>();
  private chests = new Map<string, Phaser.GameObjects.Sprite>();
  private npcs: { sprite: Phaser.GameObjects.Sprite; spot: Spot }[] = [];
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private paused = false;
  /** Short grace period after a battle so the player can walk away. */
  private safeUntil = 0;
  private lastRegion: RegionId | 'hub' | null | undefined;
  private lastTile = '';
  private off: (() => void) | null = null;

  constructor(init: WorldInit) {
    super('world');
    this.init_ = init;
  }

  create() {
    buildTextures(this);
    const { bus } = this.init_;

    // Tilemap from the generated world, with solid tiles colliding.
    const data = MAP.map((row) => [...row].map((ch) => tileIndex(LEGEND[ch])));
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
    const layer = map.createLayer(
      0,
      tileset,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    map.setCollision(SOLID.map(tileIndex), true, true, layer);
    this.physics.world.setBounds(0, 0, W * TILE, H * TILE);

    // Animations for every person sheet: down 0-1, up 2-3, side 4-5.
    const people = ['player', ...NPCS.map((n) => `npc-${n.region}`)];
    for (const key of people)
      for (const [name, start] of [
        ['down', 0],
        ['up', 2],
        ['side', 4],
      ] as const)
        this.anims.create({
          key: `${key}-${name}`,
          frames: this.anims.generateFrameNumbers(key, {
            start,
            end: start + 1,
          }),
          frameRate: 6,
          repeat: -1,
        });
    for (const s of [...this.init_.creatures, ...BOSSES]) {
      const key = s.id.startsWith('boss')
        ? `boss-${s.region}`
        : `creature-${s.region}`;
      if (!this.anims.exists(key))
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }),
          frameRate: 3,
          repeat: -1,
        });
    }

    // NPCs idle in place, chests sit closed or open.
    for (const spot of NPCS) {
      const sprite = this.add.sprite(
        center(spot.x),
        center(spot.y),
        `npc-${spot.region}`,
        0
      );
      sprite.play(`npc-${spot.region}-down`);
      this.npcs.push({ sprite, spot });
    }
    for (const spot of CHESTS) {
      const open = this.init_.openedChests.includes(spot.id);
      this.chests.set(
        spot.id,
        this.add.sprite(center(spot.x), center(spot.y), 'chest', open ? 1 : 0)
      );
    }

    // Player.
    this.player = this.physics.add.sprite(
      center(SPAWN.x),
      center(SPAWN.y),
      'player',
      0
    );
    this.player.body!.setSize(10, 8).setOffset(3, 8);
    this.player.setCollideWorldBounds(true).setDepth(10);
    this.physics.add.collider(this.player, layer);

    // Creatures wander near their spot; bosses guard theirs.
    for (const spot of this.init_.creatures) this.spawnCreature(spot);
    for (const spot of BOSSES) {
      if (this.init_.defeatedBosses.includes(spot.region)) continue;
      const boss = this.physics.add.sprite(
        center(spot.x),
        center(spot.y) - 8,
        `boss-${spot.region}`,
        0
      );
      boss.setImmovable(true).play(`boss-${spot.region}`).setDepth(5);
      boss.body!.setSize(24, 18).setOffset(4, 12);
      this.bosses.set(spot.region, boss);
      this.physics.add.collider(this.player, boss, () =>
        this.touch(() => bus.emit({ type: 'boss', region: spot.region }))
      );
    }

    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 40, max: 140 },
      lifespan: 500,
      scale: { start: 1, end: 0 },
      tint: [0xffd23f, 0x2bc4ad, 0xffffff],
      emitting: false,
    });
    this.sparks.setDepth(20);

    // Camera: follow the player across the whole map.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W * TILE, H * TILE);
    cam.setZoom(3);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setRoundPixels(true);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      up: K.UP,
      down: K.DOWN,
      left: K.LEFT,
      right: K.RIGHT,
      w: K.W,
      a: K.A,
      s: K.S,
      d: K.D,
      space: K.SPACE,
      enter: K.ENTER,
    }) as WorldScene['keys'];
    // Let React's overlays keep their own keyboard handling.
    kb.removeCapture([K.SPACE, K.ENTER, K.UP, K.DOWN, K.LEFT, K.RIGHT]);

    this.off = bus.onCommand((c) => this.command(c));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.off?.());

    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () =>
        bus.emit({
          type: 'fps',
          fps: Math.round(this.game.loop.actualFps),
          entities: this.children.length,
        }),
    });
  }

  private spawnCreature(spot: Spot) {
    const sprite = this.physics.add.sprite(
      center(spot.x),
      center(spot.y),
      `creature-${spot.region}`,
      0
    );
    sprite.play(`creature-${spot.region}`).setDepth(4);
    sprite.body!.setSize(12, 10).setOffset(2, 5);
    this.creatures.set(spot.id, { sprite, spot });
    this.physics.add.overlap(this.player, sprite, () =>
      this.touch(() =>
        this.init_.bus.emit({
          type: 'creature',
          id: spot.id,
          region: spot.region,
        })
      )
    );
    this.wander(spot.id);
  }

  /** Hop to a random neighbouring walkable tile, never more than 2 tiles from home. */
  private wander(id: string) {
    const c = this.creatures.get(id);
    if (!c) return;
    const tx = Math.round((c.sprite.x - TILE / 2) / TILE);
    const ty = Math.round((c.sprite.y - TILE / 2) / TILE);
    const options = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].filter(
      ([dx, dy]) =>
        walkable(tx + dx, ty + dy) &&
        Math.abs(tx + dx - c.spot.x) + Math.abs(ty + dy - c.spot.y) <= 2
    );
    const [dx, dy] = options.length
      ? Phaser.Utils.Array.GetRandom(options)
      : [0, 0];
    this.tweens.add({
      targets: c.sprite,
      x: center(tx + dx),
      y: center(ty + dy),
      duration: 700,
      delay: Phaser.Math.Between(400, 1600),
      ease: 'Sine.easeInOut',
      onComplete: () => this.wander(id),
    });
  }

  private touch(fire: () => void) {
    if (this.paused || this.time.now < this.safeUntil) return;
    this.paused = true; // until React answers with resume
    this.player.setVelocity(0, 0);
    fire();
  }

  private command(c: UiCommand) {
    switch (c.type) {
      case 'pause':
        this.paused = true;
        this.player.setVelocity(0, 0);
        this.player.anims.stop();
        break;
      case 'resume':
        this.paused = false;
        this.safeUntil = this.time.now + 1200;
        break;
      case 'remove-creature': {
        const cr = this.creatures.get(c.id);
        if (!cr) break;
        this.burst(cr.sprite.x, cr.sprite.y, 24);
        this.tweens.killTweensOf(cr.sprite);
        cr.sprite.destroy();
        this.creatures.delete(c.id);
        break;
      }
      case 'remove-boss': {
        const b = this.bosses.get(c.region);
        if (!b) break;
        this.burst(b.x, b.y, 60);
        this.tweens.add({
          targets: b,
          alpha: 0,
          scale: 1.6,
          duration: 600,
          onComplete: () => b.destroy(),
        });
        this.bosses.delete(c.region);
        break;
      }
      case 'open-chest':
        this.chests.get(c.id)?.setFrame(1);
        break;
      case 'respawn':
        this.player.setPosition(center(SPAWN.x), center(SPAWN.y));
        this.cameras.main.flash(400, 255, 255, 255);
        break;
      case 'fx':
        if (c.fx === 'hit' && !this.init_.reducedMotion)
          this.cameras.main.shake(180, 0.006);
        this.burst(this.player.x, this.player.y, c.fx === 'victory' ? 40 : 12);
        break;
    }
  }

  private burst(x: number, y: number, n: number) {
    this.sparks.explode(this.init_.reducedMotion ? Math.ceil(n / 4) : n, x, y);
  }

  override update() {
    if (!this.player || this.paused) return;
    const k = this.keys;
    const left = k.left.isDown || k.a.isDown;
    const right = k.right.isDown || k.d.isDown;
    const up = k.up.isDown || k.w.isDown;
    const down = k.down.isDown || k.s.isDown;
    const vx = (right ? 1 : 0) - (left ? 1 : 0);
    const vy = (down ? 1 : 0) - (up ? 1 : 0);
    const norm = vx && vy ? Math.SQRT1_2 : 1;
    this.player.setVelocity(vx * SPEED * norm, vy * SPEED * norm);

    if (vx || vy) {
      this.dir = vy > 0 ? 'down' : vy < 0 ? 'up' : vx < 0 ? 'left' : 'right';
      const anim =
        this.dir === 'left' || this.dir === 'right'
          ? 'player-side'
          : `player-${this.dir}`;
      this.player.setFlipX(this.dir === 'left');
      this.player.anims.play(anim, true);
    } else {
      this.player.anims.stop();
    }

    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    const tileKey = `${tx},${ty}`;
    if (tileKey !== this.lastTile) {
      this.lastTile = tileKey;
      if (vx || vy) this.init_.bus.emit({ type: 'step', x: tx, y: ty });
      const region = regionAt(tx, ty);
      if (region !== this.lastRegion) {
        this.lastRegion = region;
        this.init_.bus.emit({ type: 'region', region });
      }
    }

    if (
      Phaser.Input.Keyboard.JustDown(k.space) ||
      Phaser.Input.Keyboard.JustDown(k.enter)
    )
      this.interact(tx, ty);
  }

  private interact(tx: number, ty: number) {
    const near = (s: Spot) => Math.abs(s.x - tx) + Math.abs(s.y - ty) <= 1;
    const npc = this.npcs.find((n) => near(n.spot));
    if (npc) {
      // Turn the NPC to face the player.
      npc.sprite.play(
        `npc-${npc.spot.region}-${ty < npc.spot.y ? 'up' : 'down'}`
      );
      return this.touch(() =>
        this.init_.bus.emit({
          type: 'npc',
          id: npc.spot.id,
          region: npc.spot.region,
        })
      );
    }
    const chest = CHESTS.find(near);
    if (chest && this.chests.get(chest.id)?.frame.name === '0')
      this.touch(() =>
        this.init_.bus.emit({
          type: 'chest',
          id: chest.id,
          region: chest.region,
        })
      );
  }
}
