/**
 * Browser-safe contracts shared by the data registration package and frontend.
 *
 * Keep each record shape aligned with its decorated runtime entity in
 * `@rayfin-app/data`. This package must stay isomorphic, so do not import the
 * decorated classes here.
 */
export * from './editors.js';

/** A chapter's title and tagline; scenes live in `SceneContent`. */
export interface ChapterContentRecord {
  id: string;
  chapterId: string;
  title: string;
  tagline: string;
}

/** One scene; `body` is the scene as JSON without `id` and `kind`. */
export interface SceneContentRecord {
  id: string;
  chapterId: string;
  sceneKey: string;
  position: number;
  kind: string;
  body: string;
}

export type UniversalAppSchema = {
  ChapterContent: ChapterContentRecord;
  SceneContent: SceneContentRecord;
};
export * from './content.js';
export * from './validate.js';
