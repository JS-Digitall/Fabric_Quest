import { entity, role, text, uuid } from '@microsoft/rayfin-core';

import { EDITOR_EMAILS, editorPolicy } from './editorPolicy.js';

/** A chapter's title and tagline. Chapter ids are fixed to the map regions. */
@entity()
@role('authenticated', 'read')
@role('authenticated', ['create', 'update', 'delete'], {
  policy: editorPolicy(EDITOR_EMAILS),
})
export class ChapterContent {
  @uuid() id!: string;
  @text({ min: 1, max: 32, unique: true }) chapterId!: string;
  @text({ min: 1, max: 120 }) title!: string;
  @text({ min: 1, max: 200 }) tagline!: string;
}
