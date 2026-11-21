import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSfx } from './sound';

describe('createSfx', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is a silent no-op where WebAudio is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    const sfx = createSfx();
    sfx.setMuted(false);
    expect(() => sfx.play('victory')).not.toThrow();
  });

  it('plays nothing while muted and creates audio lazily once unmuted', () => {
    const created = vi.fn();
    class FakeOsc {
      type = '';
      frequency = {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      };
      connect = () => ({ connect: vi.fn() });
      start = vi.fn();
      stop = vi.fn();
    }
    class FakeCtx {
      currentTime = 0;
      destination = {};
      state = 'running';
      constructor() {
        created();
      }
      createOscillator = () => new FakeOsc();
      createGain = () => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      });
      resume = vi.fn();
    }
    vi.stubGlobal('AudioContext', FakeCtx);
    const sfx = createSfx();
    sfx.play('hit');
    expect(created).not.toHaveBeenCalled();
    sfx.setMuted(false);
    sfx.play('hit');
    expect(created).toHaveBeenCalledTimes(1);
  });
});
