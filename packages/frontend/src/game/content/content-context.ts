import type { Chapter, ChapterId } from '@rayfin-app/shared';
import { createContext, useContext } from 'react';

import type { ContentError, ContentSource } from './codec';
import type { StoredContent } from './load';

export type ContentState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'invalid';
      errors: ContentError[];
      stored: StoredContent;
      sources: Record<ChapterId, ContentSource>;
    }
  | {
      status: 'ready';
      chapters: Chapter[];
      stored: StoredContent;
      sources: Record<ChapterId, ContentSource>;
    };

export type ContentValue = ContentState & { reload(): Promise<void> };

export const ContentContext = createContext<ContentValue | null>(null);

export function useContent(): ContentValue {
  const value = useContext(ContentContext);
  if (!value) throw new Error('useContent needs a <ContentProvider>');
  return value;
}
