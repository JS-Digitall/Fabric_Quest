import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'option';

const styles: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-[0_6px_0_0_var(--color-primary-shadow)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none',
  ghost: 'border border-border bg-card text-foreground hover:bg-accent',
  option:
    'w-full justify-start border-2 border-border bg-card text-left text-foreground hover:border-primary hover:bg-accent',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-200 rounded-2xl px-500 py-300 text-400 font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
