import type { Chapter } from '../types';

const DIRECT_LAKE =
  'https://learn.microsoft.com/fabric/fundamentals/direct-lake-overview';
const STORE = 'https://learn.microsoft.com/fabric/fundamentals/store-data';

export const semantic: Chapter = {
  id: 'semantic',
  title: 'Speaking the Language of Business',
  tagline: 'Semantic models, storage modes and Power BI',
  scenes: [
    {
      kind: 'dialogue',
      id: 'semantic-intro',
      speaker: 'Priya, BI Lead',
      art: 'semantic-model',
      lines: [
        'Leadership wants one number for "revenue", not seven.',
        'A semantic model gives us shared measures, relationships and business logic on top of the lake. Let’s pick the right storage mode.',
      ],
    },
    {
      kind: 'arrange',
      id: 'semantic-layers',
      difficulties: ['beginner'],
      prompt:
        'The Measure Mimic King topples the Spire’s floors! Stack them back from raw data at the bottom to what Aurora’s leadership sees at the top.',
      items: [
        'Delta tables in a lakehouse',
        'Semantic model',
        'Power BI report',
      ],
      explanation:
        'Semantic models are the curated layer with measures, relationships and hierarchies on top of raw data; reports query the model.',
      source: STORE,
    },
    {
      kind: 'choice',
      id: 'semantic-import',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'The Measure Mimic copies everything into its memory at night, then answers lightning-fast — but never sees changes until the next refresh. Which storage mode is it imitating?',
      options: ['Import', 'DirectQuery', 'Direct Lake', 'Dual'],
      answer: 0,
      hint: 'The data is copied into memory.',
      explanation:
        'Import mode copies data during scheduled or manual refreshes. Queries run on in-memory data, but there is latency between source updates and reports.',
      source: STORE,
    },
    {
      kind: 'choice',
      id: 'semantic-dq',
      difficulties: ['beginner', 'practitioner'],
      prompt:
        'Now the mimic runs to the source system for every single question — always fresh, sometimes slow. Which storage mode is that?',
      options: ['Import', 'DirectQuery', 'Direct Lake', 'Composite'],
      answer: 1,
      explanation:
        'DirectQuery sends queries to the source system at runtime without storing data, so results are current but depend on the source’s speed.',
      source: STORE,
    },
    {
      kind: 'choice',
      id: 'semantic-dl',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'Priya wants Import-like speed on Delta tables in OneLake without duplicating data. Which storage mode does she pick?',
      options: ['DirectQuery', 'Import', 'Direct Lake', 'Live connection'],
      answer: 2,
      hint: 'Its name says where it reads from.',
      explanation:
        'Direct Lake queries Delta tables in OneLake directly, combining Import-like performance with DirectQuery-like freshness and no data duplication.',
      source: STORE,
    },
    {
      kind: 'match',
      id: 'semantic-modes',
      difficulties: ['practitioner', 'expert'],
      prompt:
        'The Mimic King jumbles the Spire’s storage-mode plaques. Match each term to its meaning.',
      pairs: [
        ['Import', 'Copies data into the model at refresh'],
        ['DirectQuery', 'Translates queries to the source on every request'],
        [
          'Direct Lake',
          'Loads Delta files from OneLake without an import copy',
        ],
        ['Composite model', 'One model with tables in different storage modes'],
      ],
      explanation:
        'Storage mode is a property of each table; a model mixing storage modes is called a composite model.',
      source: DIRECT_LAKE,
    },
    {
      kind: 'choice',
      id: 'semantic-fallback',
      difficulties: ['expert'],
      prompt:
        'The mimic threatens to drag Priya’s Direct Lake model back to DirectQuery. Which Direct Lake flavour can fall back to DirectQuery?',
      options: [
        'Direct Lake on OneLake',
        'Direct Lake on SQL analytics endpoints',
        'Both',
        'Neither',
      ],
      answer: 1,
      explanation:
        'Direct Lake on SQL falls back to DirectQuery when it can’t load directly from a Delta table. Direct Lake on OneLake doesn’t fall back.',
      source: DIRECT_LAKE,
    },
    {
      kind: 'dashboard',
      id: 'semantic-dashboard',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'The Mimic King slows Aurora’s Direct Lake on SQL report — but only on the Forecast page, whose table is built on a SQL view. What is going on?',
      chart: {
        title: 'Average visual load time per report page (seconds)',
        x: 'Page',
        y: 'Seconds',
        rows: [
          { Page: 'Sales', Seconds: 0.4 },
          { Page: 'Returns', Seconds: 0.5 },
          { Page: 'Stores', Seconds: 0.6 },
          { Page: 'Forecast', Seconds: 3.8 },
        ],
      },
      options: [
        'The Forecast table falls back to DirectQuery because it is based on a SQL view',
        'Forecast data is stored as CSV',
        'Power BI limits pages named Forecast',
        'The report needs more colours',
      ],
      answer: 0,
      hint: 'Views are not Delta tables.',
      explanation:
        'With Direct Lake on SQL, tables based on (non-materialized) SQL views fall back to DirectQuery, which can be slower than loading Delta tables directly.',
      source: DIRECT_LAKE,
    },
    {
      kind: 'dialogue',
      id: 'semantic-outro',
      speaker: 'Priya, BI Lead',
      art: 'semantic-model',
      lines: [
        'One model, one revenue number. Elif at the Governance Citadel in the south-west makes sure the right people see it — and only them.',
      ],
    },
  ],
};
