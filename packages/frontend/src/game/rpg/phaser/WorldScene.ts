import Phaser from 'phaser';

import type { RegionId } from '../campaign';
import {
  BOSSES,
  CHESTS,
  H,
  MAP,
  LEGEND,
  NPCS,
  REGIONS,
  SOLID,
  SPAWN,
  TILE,
  W,
  regionAt,
  walkable,
  type Spot,
} from '../world';
import type { Bus, UiCommand } from './bus';
import { ANIMATED, buildTextures, solidFrames, tileFrame } from './textures';

export interface WorldInit {
  bus: Bus;
  creatures: Spot[];
  openedChests: string[];
  defeatedBosses: RegionId[];
  reducedMotion: boolean;
}

const SPEED = 88;
// Effects and prompts draw above every y-sorted sprite.
const TOP = 100000;
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
  /** Tracked here, not via frame names, which Phaser stores as numbers. */
  private openChests = new Set<string>();
  private npcs: { sprite: Phaser.GameObjects.Sprite; spot: Spot }[] = [];
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private grade?: Phaser.Filters.ColorMatrix;
  private ambience = new Map<
    RegionId,
    Phaser.GameObjects.Particles.ParticleEmitter
  >();
  private prompt!: Phaser.GameObjects.Sprite;
  /** Drop shadows that follow their sprite; depth is y-sorted every frame. */
  private shadows: {
    sprite: Phaser.GameObjects.Sprite;
    img: Phaser.GameObjects.Image;
    dy: number;
  }[] = [];
  private promptBaseY = 0;
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
    const data = MAP.map((row, y) =>
      [...row].map((ch, x) => tileFrame(LEGEND[ch], x, y))
    );
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
    const layer = map.createLayer(
      0,
      tileset,
      0,
      0
    ) as Phaser.Tilemaps.TilemapLayer;
    map.setCollision(solidFrames(SOLID), true, true, layer);
    this.physics.world.setBounds(0, 0, W * TILE, H * TILE);
    // Water, lava and the fountain shimmer by swapping between two frames.
    if (!this.init_.reducedMotion)
      this.time.addEvent({
        delay: 650,
        loop: true,
        callback: () => ANIMATED.forEach(([a, b]) => layer.swapByIndex(a, b)),
      });

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

    // The hub fountain: one 32 px sprite centred on its 2×2 block of solid tiles.
    const fountainTiles = MAP.flatMap((row, y) =>
      [...row].flatMap((ch, x) => (LEGEND[ch] === 'fountain' ? [{ x, y }] : []))
    );
    if (fountainTiles.length) {
      const fx = Math.min(...fountainTiles.map((t) => t.x));
      const fy = Math.min(...fountainTiles.map((t) => t.y));
      const fountain = this.add.sprite(
        fx * TILE + TILE,
        fy * TILE + TILE,
        'fountain',
        0
      );
      fountain.setDepth(fy * TILE + TILE * 2);
      if (!this.init_.reducedMotion) {
        this.anims.create({
          key: 'fountain',
          frames: this.anims.generateFrameNumbers('fountain', {
            start: 0,
            end: 1,
          }),
          frameRate: 3,
          repeat: -1,
        });
        fountain.play('fountain');
      }
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
      this.shadowUnder(sprite, 7);
    }
    for (const spot of CHESTS) {
      const open = this.init_.openedChests.includes(spot.id);
      if (open) this.openChests.add(spot.id);
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
    this.player.setCollideWorldBounds(true);
    this.shadowUnder(this.player, 7);
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
      boss.setImmovable(true).play(`boss-${spot.region}`);
      this.shadowUnder(boss, 15, 2.2);
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
    this.sparks.setDepth(TOP);

    this.prompt = this.add
      .sprite(0, 0, 'prompt')
      .setDepth(TOP + 1)
      .setVisible(false);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      onUpdate: (t) =>
        this.prompt.setY(this.promptBaseY - (t.getValue() ?? 0) * 3),
    });

    // Camera: follow the player across the whole map.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W * TILE, H * TILE);
    cam.setZoom(3);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    this.atmosphere();

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

  /**
   * Light and air: a vignette and per-region colour grade (WebGL only — on Canvas
   * the world simply looks unfiltered), additive glows on lamps, lava and
   * crystals, and a particle mood per region.
   */
  private atmosphere() {
    const reduced = this.init_.reducedMotion;
    const cam = this.cameras.main;
    const webgl = this.game.renderer.type === Phaser.WEBGL;
    if (webgl && cam.filters) {
      cam.filters.external.addVignette(0.5, 0.5, 0.78, 0.38, 0x050816);
      this.grade = cam.filters.internal.addColorMatrix();
    }

    // Glows: every lamp and lava/crystal pool; every other tile along region edges.
    // Canvas can't tint, so the glows would blow out white — skip them there.
    if (webgl) this.addGlows(reduced);
    if (!reduced) this.addAmbience();
  }

  private addGlows(reduced: boolean) {
    const tints: Partial<Record<string, number>> = {
      lamp: 0xffcf6e,
      lava: 0xff6a2a,
      crystal: 0xa58cff,
    };
    const glows: Phaser.GameObjects.Image[] = [];
    MAP.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const kind = LEGEND[ch];
        const tint = tints[kind];
        if (tint === undefined) return;
        const edge = REGIONS.some(
          (r) =>
            (x === r.rect.x ||
              y === r.rect.y ||
              x === r.rect.x + r.rect.w - 1 ||
              y === r.rect.y + r.rect.h - 1) &&
            regionAt(x, y) === r.id
        );
        if (edge && (x + y) % 2) return;
        const g = this.add
          .image(center(x), center(y), 'glow')
          .setTint(tint)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(kind === 'lamp' ? 2.2 : 1.4)
          .setAlpha(kind === 'lamp' ? 0.55 : 0.32)
          .setDepth(TOP - 1);
        g.setData('base', g.alpha);
        glows.push(g);
      })
    );
    if (!reduced)
      this.tweens.addCounter({
        from: 0,
        to: Math.PI * 2,
        duration: 2600,
        repeat: -1,
        onUpdate: (t) => {
          const v = t.getValue() ?? 0;
          for (const g of glows)
            g.setAlpha(g.getData('base') * (0.82 + 0.18 * Math.sin(v + g.x)));
        },
      });
  }

  /** One emitter per region, running only while the player is inside it. */
  private addAmbience() {
    const moods: Record<
      RegionId,
      Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
    > = {
      onelake: {
        tint: [0xffffff, 0x8fd0ff],
        speedY: { min: -6, max: -14 },
        lifespan: 1400,
        frequency: 90,
      },
      ingest: {
        tint: [0xffb02e, 0xff6a2a],
        speedY: { min: -18, max: -36 },
        speedX: { min: -6, max: 6 },
        lifespan: 1600,
        frequency: 110,
      },
      semantic: {
        tint: [0xa58cff, 0xffffff],
        speedX: { min: -8, max: 8 },
        speedY: { min: -4, max: 4 },
        lifespan: 2400,
        frequency: 130,
      },
      governance: {
        tint: [0xcfd6e6],
        speedX: { min: 4, max: 10 },
        speedY: { min: -2, max: 2 },
        lifespan: 2600,
        frequency: 160,
      },
      fabriciq: {
        tint: [0xffffff, 0xff9ecb],
        speed: 0,
        lifespan: 1000,
        frequency: 70,
        scale: { start: 0, end: 0.9 },
      },
      apps: {
        tint: [0xffd23f, 0xff6a2a],
        speedY: { min: -40, max: -70 },
        gravityY: 70,
        lifespan: 1100,
        frequency: 90,
      },
    };
    for (const r of REGIONS) {
      const zone = new Phaser.Geom.Rectangle(
        r.rect.x * TILE,
        r.rect.y * TILE,
        r.rect.w * TILE,
        r.rect.h * TILE
      );
      const emitter = this.add.particles(0, 0, 'spark', {
        scale: { start: 1, end: 0 },
        alpha: { start: 0.9, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        emitZone: { type: 'random', source: zone, quantity: 1 },
        emitting: false,
        ...moods[r.id],
      });
      emitter.setDepth(TOP - 2);
      this.ambience.set(r.id, emitter);
    }
  }

  /** Switch the region's particles on and nudge the colour grade. */
  private setMood(region: RegionId | 'hub' | null) {
    for (const [id, emitter] of this.ambience)
      if (id === region) emitter.start();
      else emitter.stop();
    const m = this.grade?.colorMatrix;
    if (!m) return;
    m.reset();
    switch (region) {
      case 'onelake':
        m.saturate(0.15).hue(-6, true);
        break;
      case 'ingest':
        m.contrast(0.08).hue(6, true);
        break;
      case 'semantic':
        m.hue(-12, true).saturate(0.08, true);
        break;
      case 'governance':
        m.saturate(-0.12).contrast(0.1, true);
        break;
      case 'fabriciq':
        m.hue(-18, true).brightness(0.96, true);
        break;
      case 'apps':
        m.hue(8, true).contrast(0.12, true);
        break;
      default:
        m.saturate(0.1);
    }
  }

  /** A soft oval shadow that follows `sprite`, `dy` px below its centre. */
  private shadowUnder(
    sprite: Phaser.GameObjects.Sprite,
    dy: number,
    scale = 1
  ) {
    const img = this.add.image(sprite.x, sprite.y + dy, 'shadow');
    img.setScale(scale);
    this.shadows.push({ sprite, img, dy });
  }

  /** Keep shadows under their sprites and draw lower sprites in front (y-sort). */
  private syncShadows() {
    this.shadows = this.shadows.filter(({ sprite, img, dy }) => {
      if (!sprite.active) {
        img.destroy();
        return false;
      }
      img.setPosition(sprite.x, sprite.y + dy).setAlpha(sprite.alpha);
      sprite.setDepth(sprite.y + dy);
      img.setDepth(sprite.y + dy - 1);
      return true;
    });
  }

  private spawnCreature(spot: Spot) {
    const sprite = this.physics.add.sprite(
      center(spot.x),
      center(spot.y),
      `creature-${spot.region}`,
      0
    );
    sprite.play(`creature-${spot.region}`);
    sprite.body!.setSize(12, 10).setOffset(2, 5);
    this.shadowUnder(sprite, 7);
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
        this.openChests.add(c.id);
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
    this.syncShadows();
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
        this.setMood(region);
      }
    }

    // Float a "!" over whatever Space would interact with.
    const target = this.target(tx, ty);
    this.prompt.setVisible(!!target);
    if (target) this.prompt.setX(center(target.x));
    if (target) this.promptBaseY = center(target.y) - 16;

    if (
      Phaser.Input.Keyboard.JustDown(k.space) ||
      Phaser.Input.Keyboard.JustDown(k.enter)
    )
      this.interact(tx, ty);
  }

  /** Any adjacent tile counts, diagonals included. */
  private near(s: Spot, tx: number, ty: number) {
    return Math.max(Math.abs(s.x - tx), Math.abs(s.y - ty)) <= 1;
  }

  private target(tx: number, ty: number): Spot | undefined {
    return (
      this.npcs.find((n) => this.near(n.spot, tx, ty))?.spot ??
      CHESTS.find((c) => this.near(c, tx, ty) && !this.openChests.has(c.id))
    );
  }

  private interact(tx: number, ty: number) {
    const near = (s: Spot) => this.near(s, tx, ty);
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
    if (chest && !this.openChests.has(chest.id))
      this.touch(() =>
        this.init_.bus.emit({
          type: 'chest',
          id: chest.id,
          region: chest.region,
        })
      );
  }
}
