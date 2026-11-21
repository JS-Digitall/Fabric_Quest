// Illustration registry. Task 5 fills in the animated scenes.
export function Art({ id, className }: { id: string; className?: string; still?: boolean }) {
  return <div data-art={id} className={className} aria-hidden />;
}
