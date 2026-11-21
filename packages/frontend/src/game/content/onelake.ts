import type { Chapter } from '../types';

const OVERVIEW = 'https://learn.microsoft.com/fabric/onelake/onelake-overview';
const TRANSFORM =
  'https://learn.microsoft.com/fabric/onelake/shortcuts/transformations';

export const onelake: Chapter = {
  id: 'onelake',
  title: 'One Lake to Rule Them All',
  tagline: 'OneLake and the basics of Fabric',
  scenes: [
    {
      kind: 'dialogue',
      id: 'onelake-intro',
      speaker: 'Mira, Chief Data Officer',
      art: 'onelake',
      lines: [
        'Welcome to Aurora Outfitters! Our data is scattered over five lakes, three clouds and one very nervous spreadsheet.',
        'Your first job as data lead: understand OneLake, the single lake that comes with Microsoft Fabric.',
      ],
    },
    {
      kind: 'choice',
      id: 'onelake-count',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt: 'How many OneLake instances does a Fabric tenant get?',
      options: [
        'Exactly one, created automatically',
        'One per workspace',
        'One per capacity',
        'As many as you provision',
      ],
      answer: 0,
      hint: 'Think "OneDrive for data".',
      explanation:
        'Every Fabric tenant comes with a single OneLake instance. You can’t delete it or create more, and there is no infrastructure to provision.',
      source: OVERVIEW,
    },
    {
      kind: 'choice',
      id: 'onelake-format',
      difficulties: ['beginner', 'practitioner'],
      prompt: 'In which open table format do Fabric engines store tables in OneLake?',
      options: ['CSV', 'Delta Parquet', 'Excel workbooks', 'A proprietary binary format'],
      answer: 1,
      hint: 'It is open and columnar.',
      explanation:
        'T-SQL, Spark, Analysis Services and the other Fabric engines store data in the open Delta Parquet format, so every engine can use the same copy.',
      source: OVERVIEW,
    },
    {
      kind: 'choice',
      id: 'onelake-shortcut',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'The Finance team owns a table in their workspace. You need it in yours — without duplicating the data. What do you create?',
      options: ['A nightly copy pipeline', 'A shortcut', 'An export to CSV', 'A second OneLake'],
      answer: 1,
      hint: 'It points instead of copies.',
      explanation:
        'A shortcut is a reference to data stored elsewhere — another workspace, ADLS, S3 and more. Source changes are immediately visible through OneLake.',
      source: OVERVIEW,
    },
    {
      kind: 'arrange',
      id: 'onelake-hierarchy',
      difficulties: ['beginner', 'practitioner'],
      prompt: 'Order the OneLake hierarchy from broadest to narrowest.',
      items: ['Tenant', 'Workspace', 'Data item (e.g. lakehouse)'],
      hint: 'Tenant policies protect everything below them.',
      explanation:
        'Fabric data lives in a hierarchy: the tenant, then workspaces (each part of a capacity), then data items such as lakehouses and warehouses.',
      source: OVERVIEW,
    },
    {
      kind: 'match',
      id: 'onelake-unify',
      difficulties: ['practitioner', 'expert'],
      prompt: 'Match each OneLake feature to what it does.',
      pairs: [
        ['Shortcut', 'References data in place without copying it'],
        ['Database mirroring', 'Continuously replicates an operational database as Delta tables'],
        ['Metadata mirroring', 'Syncs an external catalog and reads its data through shortcuts'],
        ['Shortcut transformation', 'Turns files behind a shortcut into a synced Delta table'],
      ],
      explanation:
        'Shortcuts virtualize, database mirroring replicates, metadata mirroring syncs catalogs and uses shortcuts, and shortcut transformations convert files into Delta tables.',
      source: OVERVIEW,
    },
    {
      kind: 'choice',
      id: 'onelake-spark',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'The SQL team built a warehouse. A data scientist wants the same tables in a Spark notebook. What is needed?',
      options: [
        'Export the tables to CSV first',
        'A special Spark–SQL connector',
        'Nothing extra — Spark reads the Delta tables in OneLake directly',
        'A copy of the warehouse in a lakehouse',
      ],
      answer: 2,
      explanation:
        'Because OneLake stores tables in Delta format, Spark loads them without special connectors or exports. Both engines work on one copy of the data.',
      source: OVERVIEW,
    },
    {
      kind: 'choice',
      id: 'onelake-iceberg',
      difficulties: ['expert'],
      prompt: 'An Iceberg table lands in OneLake. How do Fabric engines read it?',
      options: [
        'They can’t — convert it to Delta manually',
        'Metadata virtualization exposes it as a Delta table automatically',
        'Only Spark can read Iceberg',
        'You must mirror it first',
      ],
      answer: 1,
      explanation:
        'OneLake generates virtual metadata so Iceberg tables can be read as Delta tables across Fabric — and Delta tables can be read by external Iceberg readers.',
      source: OVERVIEW,
    },
    {
      kind: 'choice',
      id: 'onelake-transform-sync',
      difficulties: ['expert'],
      prompt: 'How often does a shortcut file transformation check its source for changes?',
      options: ['Every two minutes', 'Once per hour', 'Only when you refresh it', 'Once per day'],
      answer: 0,
      explanation:
        'Fabric polls the shortcut every two minutes and synchronizes changes into the managed Delta table, using Fabric Spark compute.',
      source: TRANSFORM,
    },
    {
      kind: 'dialogue',
      id: 'onelake-outro',
      speaker: 'Mira, Chief Data Officer',
      art: 'onelake',
      lines: [
        'One lake, one copy, many engines. That is already less chaos.',
        'Next up: actually getting our data in there.',
      ],
    },
  ],
};
