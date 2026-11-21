import type { Chapter } from '../types';

const IQ = 'https://learn.microsoft.com/fabric/iq/overview';
const ONTOLOGY = 'https://learn.microsoft.com/fabric/iq/ontology/overview';
const TERMS =
  'https://learn.microsoft.com/fabric/fundamentals/fabric-terminology';

export const fabriciq: Chapter = {
  id: 'fabriciq',
  title: 'Teaching the Machines Our Business',
  tagline: 'Fabric IQ and ontologies',
  scenes: [
    {
      kind: 'dialogue',
      id: 'fabriciq-intro',
      speaker: 'Sam, AI Lead',
      art: 'fabric-iq',
      lines: [
        'Our new AI agents keep confusing "customer" with "account" and "order" with "shipment".',
        'Fabric IQ gives people and agents one shared vocabulary of our business. Let’s build it.',
      ],
    },
    {
      kind: 'choice',
      id: 'fabriciq-define',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt: 'What does an ontology in Fabric IQ define?',
      options: [
        'Only table and column names',
        'Business entity types, properties, relationships, rules and metrics — bound to real data',
        'Capacity sizes',
        'Report themes',
      ],
      answer: 1,
      hint: 'Customer places Order…',
      explanation:
        'An ontology defines business concepts like Customer or Order with properties, relationships, rules and metrics, and binds them to enterprise data.',
      source: ONTOLOGY,
    },
    {
      kind: 'choice',
      id: 'fabriciq-not-store',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt: 'Does the ontology copy your data into a new data store?',
      options: [
        'Yes, it is a new database',
        'No — it stores definitions and bindings; queries run against the bound sources',
        'Yes, but only for semantic models',
        'Only in preview',
      ],
      answer: 1,
      explanation:
        'Ontology is a business context layer. It stores definitions and bindings and isn’t a general-purpose query engine; consuming experiences query the bound sources.',
      source: ONTOLOGY,
    },
    {
      kind: 'choice',
      id: 'fabriciq-bootstrap',
      difficulties: ['beginner', 'practitioner'],
      prompt:
        'We already have trusted Power BI semantic models. What is the fastest start?',
      options: [
        'Re-type every definition by hand',
        'Generate the ontology from the semantic models',
        'Export the models to Excel',
        'Ask each team for a glossary',
      ],
      answer: 1,
      explanation:
        'You can generate an ontology from Power BI semantic models, carrying over relationships, calculated columns and source-owned DAX measures as metrics.',
      source: IQ,
    },
    {
      kind: 'arrange',
      id: 'fabriciq-steps',
      difficulties: ['beginner', 'practitioner'],
      prompt: 'Put the ontology journey in order.',
      items: [
        'Define entity types such as Customer and Order',
        'Bind them to data in Fabric sources',
        'Let people and agents ask questions using that shared context',
      ],
      explanation:
        'You define business concepts, bind them to enterprise data, and then agents and applications use the same vocabulary and context.',
      source: ONTOLOGY,
    },
    {
      kind: 'match',
      id: 'fabriciq-family',
      difficulties: ['practitioner', 'expert'],
      prompt:
        'Microsoft IQ has several members. Match each to the context it provides.',
      pairs: [
        ['Fabric IQ', 'Business entities and data'],
        ['Work IQ', 'How employees work'],
        ['Foundry IQ', 'Policies and authoritative documents'],
        ['Web IQ', 'Context from the web'],
      ],
      explanation:
        'Fabric IQ works alongside Work IQ, Foundry IQ and Web IQ to give a complete view of an organization.',
      source: IQ,
    },
    {
      kind: 'choice',
      id: 'fabriciq-rules',
      difficulties: ['practitioner', 'expert'],
      prompt: 'How are business rules captured in an ontology?',
      options: [
        'In natural language, linked to entities',
        'As Python scripts',
        'As Excel macros',
        'They can’t be',
      ],
      answer: 0,
      explanation:
        'Rules capture business logic in natural language and link it to entities, properties and relationships, so many consumers reuse the same rule.',
      source: ONTOLOGY,
    },
    {
      kind: 'choice',
      id: 'fabriciq-proposal',
      difficulties: ['expert'],
      prompt: 'The ontology agent suggests new definitions. What happens next?',
      options: [
        'They are applied immediately',
        'It follows a proposal-first model — you review before applying',
        'They are emailed to Microsoft',
        'They replace the semantic model',
      ],
      answer: 1,
      explanation:
        'The ontology agent proposes changes for your review; changes follow a proposal-first model.',
      source: ONTOLOGY,
    },
    {
      kind: 'choice',
      id: 'fabriciq-retire',
      difficulties: ['expert'],
      prompt: 'When does the old ontology experience retire?',
      options: ['Jan 31, 2027', 'Dec 31, 2026', 'It already retired', 'Never'],
      answer: 0,
      explanation:
        'The old experience of ontology retires on January 31, 2027; new items use the new experience.',
      source: ONTOLOGY,
    },
    {
      kind: 'choice',
      id: 'fabriciq-preview',
      difficulties: ['beginner'],
      prompt: 'What is the release status of the Fabric IQ workload?',
      options: [
        'Preview',
        'Retired',
        'On-premises only',
        'Only in Power BI Desktop',
      ],
      answer: 0,
      explanation:
        'IQ is a Fabric workload in preview that groups items for unifying business semantics.',
      source: TERMS,
    },
    {
      kind: 'dialogue',
      id: 'fabriciq-outro',
      speaker: 'Sam, AI Lead',
      art: 'fabric-iq',
      lines: [
        'Now the agents speak Aurora. Last challenge: ship an app for the whole company.',
      ],
    },
  ],
};
