import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { getRayfinClient } from '@/lib/rayfin-client';

import { assembleChapters } from './codec';
import { ContentContext, type ContentState } from './content-context';
import { chapters as starter } from './index';
import { loadContent, type StoredContent } from './load';

type Load = () => Promise<StoredContent>;

const defaultLoad: Load = async () => loadContent(await getRayfinClient());

/** Loads stored content and decides whether the game can be played. */
async function resolveContent(load: Load): Promise<ContentState> {
  try {
    const stored = await load();
    const r = assembleChapters(stored.meta, stored.rows, starter);
    return r.invalid.length
      ? { status: 'invalid', errors: r.invalid, stored, sources: r.sources }
      : { status: 'ready', chapters: r.chapters, stored, sources: r.sources };
  } catch (e) {
    return {
      status: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export function ContentProvider({
  load = defaultLoad,
  children,
}: {
  load?: Load;
  children: ReactNode;
}) {
  const [state, setState] = useState<ContentState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await resolveContent(load);
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const reload = useCallback(async () => {
    setState({ status: 'loading' });
    setState(await resolveContent(load));
  }, [load]);

  return (
    <ContentContext.Provider value={{ ...state, reload }}>
      {children}
    </ContentContext.Provider>
  );
}
