import { Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

import { cn } from '@/lib/utils';

import type { Answer, ArrangeScene as Scene } from '../types';
import { PixelButton } from '../rpg/ui/kit';
import { shuffled } from './shuffle';

export function ArrangeScene({
  scene,
  locked,
  onSubmit,
}: {
  scene: Scene;
  locked: boolean;
  onSubmit: (a: Answer) => void;
}) {
  const [order, setOrder] = useState(() => shuffled(scene.items));

  function move(from: number, to: number, el: HTMLElement) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
    // Keep focus on the moved item.
    requestAnimationFrame(() =>
      (el.parentElement?.children[to] as HTMLElement | undefined)?.focus()
    );
  }

  function onKey(e: KeyboardEvent<HTMLLIElement>, i: number) {
    if (locked) return;
    if (e.key === 'ArrowUp') move(i, i - 1, e.currentTarget);
    if (e.key === 'ArrowDown') move(i, i + 1, e.currentTarget);
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
  }

  return (
    <div className="mt-500">
      <p className="mb-300 text-300 text-muted-foreground">
        Drag the cards, or focus one and use ↑ / ↓.
      </p>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={locked ? () => {} : setOrder}
        className="grid gap-200"
      >
        {order.map((item, i) => {
          const right = locked && scene.items[i] === item;
          return (
            <Reorder.Item
              key={item}
              value={item}
              data-value={item}
              dragListener={!locked}
              tabIndex={0}
              aria-label={`${i + 1}. ${item}`}
              onKeyDown={(e: KeyboardEvent<HTMLLIElement>) => onKey(e, i)}
              data-state={locked ? (right ? 'right' : 'wrong') : undefined}
              className={cn(
                'px-option',
                !locked && 'cursor-grab active:cursor-grabbing'
              )}
            >
              <span aria-hidden className="px-option-key">
                {i + 1}
              </span>
              <span className="flex-1">{item}</span>
              <GripVertical
                className="icon-size-300 text-muted-foreground"
                aria-hidden
              />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {!locked && (
        <PixelButton
          className="mt-400"
          onClick={() => onSubmit({ kind: 'order', items: order })}
        >
          Lock in order
        </PixelButton>
      )}
    </div>
  );
}
