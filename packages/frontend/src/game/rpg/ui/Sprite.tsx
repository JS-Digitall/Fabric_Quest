import { useEffect, useRef, useState } from 'react';

import {
  drawBoss,
  drawCreature,
  drawPerson,
  type Palette,
} from '../phaser/textures';

type Ctx = CanvasRenderingContext2D;

/** Renders one of the code-drawn sprites at a crisp pixel scale, animating 2 frames. */
function PixelCanvas({
  size,
  scale,
  draw,
  label,
}: {
  size: number;
  scale: number;
  draw: (c: Ctx, frame: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setFrame((f) => 1 - f), 420);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const c = ref.current?.getContext?.('2d');
    if (!c) return;
    c.clearRect(0, 0, size, size);
    draw(c, frame);
  }, [draw, frame, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      style={{
        width: size * scale,
        height: size * scale,
        imageRendering: 'pixelated',
      }}
    />
  );
}

export function FoeSprite({
  kind,
  color,
  label,
}: {
  kind: 'creature' | 'boss';
  color: string;
  label: string;
}) {
  return kind === 'boss' ? (
    <PixelCanvas
      size={32}
      scale={6}
      label={label}
      draw={(c, f) => drawBoss(c, 0, color, f)}
    />
  ) : (
    <PixelCanvas
      size={16}
      scale={9}
      label={label}
      draw={(c, f) => drawCreature(c, 0, color, f)}
    />
  );
}

export function PersonSprite({
  palette,
  label,
  scale = 6,
}: {
  palette: Palette;
  label: string;
  scale?: number;
}) {
  return (
    <PixelCanvas
      size={16}
      scale={scale}
      label={label}
      draw={(c, f) => drawPerson(c, 0, palette, 0, f)}
    />
  );
}
