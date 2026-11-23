import { entity, int, role, text, uuid } from '@microsoft/rayfin-core';

import { EDITOR_EMAILS, editorPolicy } from './editorPolicy.js';

/** One story or question scene; `body` is the validated scene as JSON. */
@entity()
@role('authenticated', 'read')
@role('authenticated', ['create', 'update', 'delete'], {
  policy: editorPolicy(EDITOR_EMAILS),
})
export class SceneContent {
  @uuid() id!: string;
  @text({ min: 1, max: 32 }) chapterId!: string;
  @text({ min: 1, max: 80, unique: true }) sceneKey!: string;
  @int() position!: number;
  @text({ min: 1, max: 16 }) kind!: string;
  @text({ min: 2, max: 4000 }) body!: string;
}
