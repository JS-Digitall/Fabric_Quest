import type { Chapter } from '../types';

// Fabric App limits come from the installed Rayfin guide (node_modules/@microsoft/rayfin-guide/assets/docs).
const LIMITS = 'rayfin-docs:known-limitations.md';

export const apps: Chapter = {
  id: 'apps',
  title: 'Pushing the Limits',
  tagline: 'Fabric Apps — and where they stop',
  scenes: [
    {
      kind: 'dialogue',
      id: 'apps-intro',
      speaker: 'You',
      art: 'app-limits',
      lines: [
        'Fun fact: this game itself is a Fabric App — React, animations, charts, all behind Fabric sign-in.',
        'Fabric Apps can do a lot. But every platform has edges. Let’s find them before our users do.',
      ],
    },
    {
      kind: 'dashboard',
      id: 'apps-paging',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'The order list in our app shows exactly 100 rows, but the table holds 2,500. Why?',
      chart: {
        title: 'Rows in table vs. rows shown in the app',
        x: 'Measure',
        y: 'Rows',
        rows: [
          { Measure: 'Rows in table', Rows: 2500 },
          { Measure: 'Rows shown', Rows: 100 },
        ],
      },
      options: [
        'Collection queries return one page — 100 records by default — unless you page through them',
        'Fabric deletes old orders',
        'The browser can only show 100 rows',
        'The chart is wrong',
      ],
      answer: 0,
      hint: 'Look for the word "page".',
      explanation:
        'The default page size is 100 (maximum 100,000). Use .first(n) with .executePaginated() and .after(endCursor) for longer lists.',
      source: LIMITS,
    },
    {
      kind: 'choice',
      id: 'apps-kql',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'Which data source can’t you add as a new connector in this release?',
      options: [
        'A Power BI semantic model',
        'An Eventhouse KQL database',
        'Your app’s own data entities',
        'None — everything works',
      ],
      answer: 1,
      explanation:
        'Eventhouse (KQL) connector authoring is held in this release, so `connector add --type eventhouse` refuses. Semantic model connectors can be added today.',
      source: 'rayfin-docs:cli/connectors/category-b-function-bridge.md',
    },
    {
      kind: 'choice',
      id: 'apps-m2m',
      difficulties: ['practitioner', 'expert'],
      prompt:
        'Students and courses need a many-to-many relationship. How do you model it?',
      options: [
        'Use @many() on both sides',
        'Many-to-many isn’t supported — add a join entity with two @one() navigations',
        'Store IDs in a comma-separated text field',
        'Use a semantic model instead',
      ],
      answer: 1,
      explanation:
        'Many-to-many relationships are not supported. Use an explicit join entity with two @one() navigations instead.',
      source: LIMITS,
    },
    {
      kind: 'choice',
      id: 'apps-count',
      difficulties: ['practitioner', 'expert'],
      prompt:
        'You need the number of open tickets. What works on the fluent GraphQL client?',
      options: [
        'Call count()',
        'Select minimal fields and use results.length',
        'Download the database',
        'Ask the user to count',
      ],
      answer: 1,
      explanation:
        'count() is not available on the fluent GraphQL client. Select minimal fields and compute results.length instead.',
      source: LIMITS,
    },
    {
      kind: 'choice',
      id: 'apps-zip',
      difficulties: ['beginner', 'practitioner'],
      prompt: 'How big may the compressed static hosting upload of an app be?',
      options: ['10 MB', '100 MB', '1 GB', 'Unlimited'],
      answer: 1,
      explanation:
        'The compressed ZIP archive must not exceed 100 MB. Move large binaries to the storage service instead.',
      source: 'rayfin-docs:hosting/index.md',
    },
    {
      kind: 'choice',
      id: 'apps-timeout',
      difficulties: ['expert'],
      prompt:
        'A trusted function crunches numbers for 6 minutes. What happens?',
      options: [
        'It finishes fine',
        'The host aborts it — invocations are capped at 250 seconds',
        'It moves to a bigger capacity',
        'The browser retries forever',
      ],
      answer: 1,
      explanation:
        'timeoutMs is clamped to the Fabric UDF host ceiling of 250 seconds; the host aborts any invocation at that limit.',
      source: 'rayfin-docs:functions/invoking-from-frontend.md',
    },
    {
      kind: 'choice',
      id: 'apps-text',
      difficulties: ['expert'],
      prompt: 'Why should every string field use @text({ max: N })?',
      options: [
        'It is only a style rule',
        'Without max, MSSQL gets NVARCHAR(MAX), which can break the generated GraphQL schema',
        'It makes the app load faster in Chrome',
        'Fabric rejects strings otherwise',
      ],
      answer: 1,
      explanation:
        '@text() without max generates NVARCHAR(MAX) on MSSQL; the metadata provider may fail to build a GraphQL schema from these columns.',
      source: LIMITS,
    },
    {
      kind: 'choice',
      id: 'apps-anon',
      difficulties: ['beginner', 'practitioner'],
      prompt:
        'You want visitors to read data without signing in (@anonymous). What do you need on Fabric?',
      options: [
        'Nothing',
        'A tenant admin must enable anonymous data access for Fabric Apps',
        'A bigger capacity',
        'A public GitHub repo',
      ],
      answer: 1,
      explanation:
        'Anonymous permissions require a tenant admin setting; without it, applying the schema fails with HTTP 403. Prefer @authenticated() otherwise.',
      source: LIMITS,
    },
    {
      kind: 'match',
      id: 'apps-platform',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt: 'Fabric Apps on Microsoft Fabric — match the topic to the rule.',
      pairs: [
        ['Language', 'TypeScript only'],
        ['Database', 'MSSQL only'],
        ['Authentication', 'Fabric SSO (Entra ID single sign-on)'],
        [
          'File storage',
          'Available on Fabric, not in self-hosted Rayfin Local',
        ],
      ],
      explanation:
        'Rayfin supports TypeScript only. On Fabric, databases are MSSQL, sign-in is Fabric SSO, and the storage service is available.',
      source: 'rayfin-docs:index.md',
    },
    {
      kind: 'dialogue',
      id: 'apps-outro',
      speaker: 'Mira, Chief Data Officer',
      art: 'app-limits',
      lines: [
        'You found the edges before our users did. That is what a data lead does.',
        'Aurora Outfitters is officially running on Fabric. Well played!',
      ],
    },
  ],
};
