import { ChapterContent } from './ChapterContent.js';
import { SceneContent } from './SceneContent.js';
import type { UniversalAppSchema } from '@rayfin-app/shared';

/**
 * The app's Rayfin data schema. Keep `schema` in step with
 * `UniversalAppSchema` in `@rayfin-app/shared`, which types the client.
 */
export type { UniversalAppSchema };
export { ChapterContent, SceneContent };

export const schema = [ChapterContent, SceneContent];
