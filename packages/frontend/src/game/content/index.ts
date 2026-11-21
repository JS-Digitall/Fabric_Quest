import type { Chapter } from '../types';
import { apps } from './apps';
import { fabriciq } from './fabriciq';
import { governance } from './governance';
import { ingest } from './ingest';
import { onelake } from './onelake';
import { semantic } from './semantic';

export const chapters: Chapter[] = [onelake, ingest, semantic, governance, fabriciq, apps];
