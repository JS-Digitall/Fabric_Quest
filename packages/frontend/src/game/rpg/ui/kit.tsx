import {
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

/*
 * The pixel UI kit: every window, button, bar and menu in the game is built from these,
 * so the whole product reads as one JRPG. Styling lives in global.css (.px-*).
 */

export function PixelWindow({
  tone = 'night',
  className,
  ...props
}: ComponentProps<'div'> & { tone?: 'night' | 'parchment' }) {
  return (
    <div
      className={cn(
        'px-window px-ui',
        tone === 'parchment' && 'px-parchment',
        className
      )}
      {...props}
    />
  );
}

export function PixelButton({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: 'primary' | 'ghost' }) {
  return (
    <button
      type="button"
      className={cn(
        'px-button',
        variant === 'ghost' && 'px-button-ghost',
        className
      )}
      {...props}
    />
  );
}

export function PixelChip({
  tone = 'muted',
  children,
}: {
  tone?: 'gold' | 'muted';
  children: ReactNode;
}) {
  return (
    <span className={cn('px-chip', tone === 'gold' && 'px-chip-gold')}>
      {children}
    </span>
  );
}

/** A segmented HP-style bar; a real progressbar for assistive tech. */
export function PixelBar({
  label,
  value,
  max,
  color,
  segments = 10,
  showValue = true,
  showLabel = true,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  segments?: number;
  showValue?: boolean;
  /** When false the label is only announced to assistive tech. */
  showLabel?: boolean;
}) {
  const filled = max > 0 ? Math.ceil((Math.max(0, value) / max) * segments) : 0;
  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-baseline justify-between font-pixel text-200 uppercase tracking-wider text-muted-foreground',
          !showLabel && !showValue && 'hidden'
        )}
      >
        <span className={cn(!showLabel && 'sr-only')}>{label}</span>
        {showValue && (
          <span className="tabular-nums text-foreground">
            {value}/{max}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="px-bar mt-100"
      >
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className="px-bar-seg"
            style={i < filled ? { background: color } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A JRPG command menu. Roving tabindex: arrow keys move the cursor (no animation —
 * keyboard actions should feel instant), Enter/Space or click selects.
 */
export function CommandList({
  label,
  options,
  picked,
  answer,
  onPick,
}: {
  label: string;
  options: string[];
  picked: number | null;
  /** The correct index once locked; null while the player is choosing. */
  answer: number | null;
  onPick: (index: number) => void;
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const locked = answer !== null;

  function move(to: number) {
    const next = (to + options.length) % options.length;
    setActive(next);
    refs.current[next]?.focus();
  }

  function onKey(e: KeyboardEvent, i: number) {
    const step: Record<string, number> = {
      ArrowDown: i + 1,
      ArrowUp: i - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (e.key in step) {
      e.preventDefault();
      move(step[e.key]);
    }
  }

  return (
    <ul aria-label={label} className="mt-400 grid gap-200">
      {options.map((option, i) => {
        const state = !locked
          ? undefined
          : i === answer
            ? 'right'
            : i === picked
              ? 'wrong'
              : 'dim';
        return (
          <li key={option}>
            <button
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              tabIndex={i === active ? 0 : -1}
              disabled={locked}
              data-state={state}
              onFocus={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => onPick(i)}
              className="px-option"
            >
              <span className="px-cursor" aria-hidden>
                ▶︎
              </span>
              <span className="px-option-key" aria-hidden>
                {state === 'right'
                  ? '✓'
                  : state === 'wrong'
                    ? '✗'
                    : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
