/*
 * Chiptune sound effects synthesized with WebAudio — no audio files ship with the app.
 * Muted until the player opts in; silently does nothing where WebAudio is missing.
 */

export type Sfx =
  'step' | 'talk' | 'hit' | 'heal' | 'victory' | 'select' | 'faint';

// [frequency Hz, duration s] notes played back to back.
const TUNES: Record<
  Sfx,
  { wave: OscillatorType; notes: [number, number][]; volume: number }
> = {
  step: { wave: 'triangle', notes: [[180, 0.03]], volume: 0.04 },
  talk: {
    wave: 'square',
    notes: [
      [660, 0.04],
      [880, 0.04],
    ],
    volume: 0.05,
  },
  select: { wave: 'square', notes: [[990, 0.05]], volume: 0.05 },
  hit: {
    wave: 'sawtooth',
    notes: [
      [220, 0.06],
      [140, 0.1],
    ],
    volume: 0.08,
  },
  heal: {
    wave: 'triangle',
    notes: [
      [523, 0.08],
      [659, 0.08],
      [784, 0.14],
    ],
    volume: 0.08,
  },
  victory: {
    wave: 'square',
    notes: [
      [523, 0.09],
      [659, 0.09],
      [784, 0.09],
      [1047, 0.25],
    ],
    volume: 0.06,
  },
  faint: {
    wave: 'triangle',
    notes: [
      [392, 0.15],
      [330, 0.15],
      [262, 0.3],
    ],
    volume: 0.08,
  },
};

export function createSfx() {
  let muted = true;
  let ctx: AudioContext | null = null;

  function audio(): AudioContext | null {
    const Ctor = globalThis.AudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  return {
    setMuted(next: boolean) {
      muted = next;
    },
    play(name: Sfx) {
      if (muted) return;
      const ac = audio();
      if (!ac) return;
      const tune = TUNES[name];
      let t = ac.currentTime;
      for (const [freq, dur] of tune.notes) {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = tune.wave;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(tune.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + dur);
        t += dur;
      }
    },
  };
}
