import type { Scene } from '@rayfin-app/shared';

export const KIND_LABEL: Record<Scene['kind'], string> = {
  dialogue: 'Story',
  choice: 'Multiple choice',
  arrange: 'Put in order',
  match: 'Match pairs',
  dashboard: 'Read the chart',
};
