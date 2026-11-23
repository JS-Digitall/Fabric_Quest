import { CHAPTER_IDS, type ChapterId } from '@rayfin-app/shared';
import { useMemo, useState, type ReactNode } from 'react';

import { getRayfinClient } from '@/lib/rayfin-client';

import { chapters as starter } from '../content';
import { assembleChapters } from '../content/codec';
import { useContent } from '../content/content-context';
import { PixelButton, PixelChip, PixelWindow } from '../rpg/ui/kit';
import { ChapterPanel, type Run } from './ChapterPanel';
import { copyStarter, ValidationBlockedError, WriteRefusedError } from './repo';

function describeError(e: unknown): ReactNode {
  if (e instanceof WriteRefusedError)
    return 'You’re not on this app’s editor list. Ask whoever deployed it to add your sign-in email.';
  if (e instanceof ValidationBlockedError)
    return (
      <>
        This change would break the chapter:
        <ul className="mt-100 list-disc pl-500">
          {e.issues.map((i, n) => (
            <li key={n}>{i.message}</li>
          ))}
        </ul>
      </>
    );
  return e instanceof Error ? e.message : String(e);
}

/** Editors change each chapter's questions; changes go live on save. */
export function EditorScreen({ onBack }: { onBack: () => void }) {
  const content = useContent();
  const [selected, setSelected] = useState<ChapterId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReactNode>(null);

  const stored =
    content.status === 'ready' || content.status === 'invalid'
      ? content.stored
      : null;
  const assembled = useMemo(
    () => stored && assembleChapters(stored.meta, stored.rows, starter),
    [stored]
  );

  const run: Run = async (write) => {
    setBusy(true);
    setError(null);
    try {
      await write(await getRayfinClient());
      await content.reload();
      return true;
    } catch (e) {
      setError(describeError(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const errorBox = error && (
    <div role="alert" className="text-400 text-destructive">
      {error}
    </div>
  );

  let body: ReactNode;
  if (!stored || !assembled)
    body =
      content.status === 'error' ? (
        <div role="alert" className="grid gap-300">
          <p>{content.message}</p>
          <PixelButton
            className="justify-self-start px-500 py-200"
            onClick={() => void content.reload()}
          >
            Retry
          </PixelButton>
        </div>
      ) : (
        <p role="status">Loading the questions…</p>
      );
  else {
    const onStarter = CHAPTER_IDS.filter((id) => assembled.sources[id] === 'starter');
    const id = selected;
    body = (
      <div className="grid gap-500 md:grid-cols-[15rem_1fr]">
        <nav aria-label="Chapters" className="grid content-start gap-200">
          {CHAPTER_IDS.map((cid) => {
            const broken = assembled.invalid.some((e) => e.chapterId === cid);
            const title =
              stored.meta.find((m) => m.chapterId === cid)?.title ??
              starter.find((c) => c.id === cid)!.title;
            return (
              <PixelButton
                key={cid}
                variant={cid === id ? 'primary' : 'ghost'}
                className="flex items-center justify-between gap-200 px-300 py-200 text-left text-400"
                aria-current={cid === id ? 'true' : undefined}
                onClick={() => {
                  setSelected(cid);
                  setError(null);
                }}
              >
                <span>{title}</span>
                <PixelChip tone={broken ? 'gold' : 'muted'}>
                  {broken
                    ? 'Needs fixing'
                    : assembled.sources[cid] === 'starter'
                      ? 'Starter'
                      : 'Saved'}
                </PixelChip>
              </PixelButton>
            );
          })}
          {onStarter.length > 0 && (
            <PixelButton
              variant="ghost"
              className="mt-300 px-300 py-200 text-300"
              disabled={busy}
              onClick={() =>
                void run(async (c) => {
                  for (const cid of onStarter) {
                    const ch = starter.find((x) => x.id === cid)!;
                    const metaId =
                      stored.meta.find((m) => m.chapterId === cid)?.id ?? null;
                    const r = await copyStarter(c, ch, new Set(), metaId);
                    if (r.failed.length)
                      throw new Error(
                        `Some questions in “${ch.title}” weren’t copied. Copy again to finish.`
                      );
                  }
                })
              }
            >
              Copy all starter chapters
            </PixelButton>
          )}
        </nav>
        {id ? (
          <ChapterPanel
            key={id}
            starter={starter.find((c) => c.id === id)!}
            chapter={assembled.chapters.find((c) => c.id === id)}
            source={assembled.sources[id]}
            invalid={assembled.invalid.find((e) => e.chapterId === id)}
            rows={stored.rows.filter((r) => r.chapterId === id)}
            meta={stored.meta.find((m) => m.chapterId === id)}
            busy={busy}
            error={errorBox}
            run={run}
          />
        ) : (
          <p className="text-400 text-foreground/90">
            Pick a chapter to edit its questions.
          </p>
        )}
      </div>
    );
  }

  return (
    <PixelWindow className="w-full max-w-6xl px-500 py-500">
      <div className="mb-500 flex flex-wrap items-center justify-between gap-300">
        <h2 className="font-pixel text-600 text-[#ffd23f]">Question editor</h2>
        <PixelButton variant="ghost" className="px-400 py-200" onClick={onBack}>
          Back to title
        </PixelButton>
      </div>
      {body}
    </PixelWindow>
  );
}
