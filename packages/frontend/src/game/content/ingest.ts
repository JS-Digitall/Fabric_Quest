import type { Chapter } from '../types';

const GUIDE =
  'https://learn.microsoft.com/fabric/data-factory/decision-guide-data-movement';
const E2E =
  'https://learn.microsoft.com/fabric/data-factory/tutorial-end-to-end-introduction';

export const ingest: Chapter = {
  id: 'ingest',
  title: 'The Great Data Migration',
  tagline: 'Data Factory, Copy job, mirroring and lakehouses',
  scenes: [
    {
      kind: 'dialogue',
      id: 'ingest-intro',
      speaker: 'Jonas, Data Engineer',
      art: 'pipeline',
      lines: [
        'Our webshop orders sit in an operational database, clickstream events stream in all day, and the raw files arrive every night.',
        'Fabric has several ways to move data. Picking the right one saves us weeks.',
      ],
    },
    {
      kind: 'choice',
      id: 'ingest-bronze',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'You are ingesting raw (bronze) data and will soon need scheduling, schema mapping and incremental loads. Where do you start?',
      options: ['Mirroring', 'Copy job', 'Eventstreams', 'A notebook that downloads files'],
      answer: 1,
      hint: 'It supports bulk, incremental and CDC — without building a pipeline.',
      explanation:
        'Microsoft recommends starting raw ingestion with Copy job: native bulk, incremental and CDC copying without the complexity of building pipelines.',
      source: GUIDE,
    },
    {
      kind: 'choice',
      id: 'ingest-gold',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'Another team already processes curated (gold) data elsewhere. You just need it in Fabric for reporting, simply and cheaply.',
      options: ['Mirroring', 'Copy activity in a pipeline', 'Dataflow Gen2', 'Eventstreams'],
      answer: 0,
      hint: 'It is free and needs minimal setup.',
      explanation:
        'For gold data, Mirroring is the simplest and most cost-effective choice: it is free, needs minimal setup and continuously replicates into OneLake.',
      source: GUIDE,
    },
    {
      kind: 'choice',
      id: 'ingest-stream',
      difficulties: ['beginner', 'practitioner'],
      prompt: 'Clickstream events need low-latency, event-driven ingestion. Which tool?',
      options: ['Copy job', 'Mirroring', 'Eventstreams', 'Dataflow Gen2'],
      answer: 2,
      explanation:
        'Eventstreams provide real-time pipelines with no-code transformations and routing to destinations such as Eventhouse, Lakehouse and Activator.',
      source: GUIDE,
    },
    {
      kind: 'choice',
      id: 'ingest-orchestrate',
      difficulties: ['practitioner', 'expert'],
      prompt:
        'You need parameterized, metadata-driven ingestion of 200 tables plus complex orchestration. What fits best?',
      options: ['Mirroring', 'Copy activity in a pipeline', 'A shortcut', 'Eventstreams'],
      answer: 1,
      explanation:
        'For complex orchestration, pipelines give the flexibility you need, and copy activities offer data object parameterization and metadata-driven ingestion.',
      source: GUIDE,
    },
    {
      kind: 'choice',
      id: 'ingest-dataflow',
      difficulties: ['beginner', 'practitioner'],
      prompt: 'Which item gives you a low-code interface with 300+ transformations?',
      options: ['Dataflow Gen2', 'Copy job', 'Mirroring', 'A shortcut'],
      answer: 0,
      explanation:
        'Dataflow Gen2 offers a low-code interface with 300+ transformations and can load results into destinations like a lakehouse or Azure SQL Database.',
      source: E2E,
    },
    {
      kind: 'arrange',
      id: 'ingest-pipeline',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt: 'Build the end-to-end flow: put the steps in order.',
      items: [
        'Copy job lands raw data in a bronze lakehouse table',
        'Dataflow Gen2 transforms bronze into a gold table',
        'A pipeline orchestrates both, notifies and runs on a schedule',
      ],
      hint: 'Ingest, transform, automate.',
      explanation:
        'The Data Factory end-to-end scenario ingests with a Copy job, transforms with a dataflow, then orchestrates and schedules everything with a pipeline.',
      source: E2E,
    },
    {
      kind: 'choice',
      id: 'ingest-mirror-dest',
      difficulties: ['expert'],
      prompt: 'Where does Mirroring write its data?',
      options: [
        'Any destination you configure',
        'A single, read-only destination in OneLake',
        'Directly into a semantic model',
        'An Eventhouse only',
      ],
      answer: 1,
      explanation:
        'Mirroring is optimized for ease of use and writes to a single, read-only destination in OneLake.',
      source: GUIDE,
    },
    {
      kind: 'match',
      id: 'ingest-match',
      difficulties: ['practitioner', 'expert'],
      prompt: 'Match each data movement option to its sweet spot.',
      pairs: [
        ['Mirroring', 'Turn-key, near real-time replication'],
        ['Copy job', 'Bulk, incremental and CDC copy without building a pipeline'],
        ['Copy activity', 'Pipeline-based ingestion where you track incremental state'],
        ['Eventstreams', 'Real-time, event-driven processing'],
      ],
      explanation:
        'The decision guide maps Mirroring to replication, Copy job to managed ingestion, Copy activity to orchestrated pipelines and Eventstreams to streaming.',
      source: GUIDE,
    },
    {
      kind: 'dialogue',
      id: 'ingest-outro',
      speaker: 'Jonas, Data Engineer',
      art: 'pipeline',
      lines: ['Bronze is filling, gold is shining. Time to make it useful for the business.'],
    },
  ],
};
