import type { Chapter } from '../types';

const PERMISSIONS = 'https://learn.microsoft.com/fabric/security/permission-model';
const ENDORSE = 'https://learn.microsoft.com/fabric/governance/endorsement-overview';
const LABELS =
  'https://learn.microsoft.com/fabric/enterprise/powerbi/service-security-enable-data-sensitivity-labels';
const CATALOG = 'https://learn.microsoft.com/fabric/governance/onelake-catalog-explore';

export const governance: Chapter = {
  id: 'governance',
  title: 'Guardians of the Data',
  tagline: 'Workspace roles, endorsement and sensitivity labels',
  scenes: [
    {
      kind: 'dialogue',
      id: 'governance-intro',
      speaker: 'Elif, Security Officer',
      art: 'governance-shield',
      lines: [
        'Someone shared the salary table with the whole company. Twice.',
        'Let’s set up access, trust and protection properly this time.',
      ],
    },
    {
      kind: 'arrange',
      id: 'governance-roles',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt: 'Order the workspace roles from fewest to most permissions.',
      items: ['Viewer', 'Contributor', 'Member', 'Admin'],
      hint: 'Viewers can only look.',
      explanation:
        'Viewer can view; Contributor can view and modify; Member can also share; Admin can additionally manage permissions and the workspace itself.',
      source: PERMISSIONS,
    },
    {
      kind: 'choice',
      id: 'governance-contributor',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt:
        'An analyst must create and modify items in the workspace, but must not share content or add members. Which role?',
      options: ['Viewer', 'Contributor', 'Member', 'Admin'],
      answer: 1,
      explanation:
        'Contributors can create items and write data, but only Members and Admins can add members and share content.',
      source: PERMISSIONS,
    },
    {
      kind: 'choice',
      id: 'governance-delete',
      difficulties: ['beginner', 'practitioner'],
      prompt: 'Which workspace role can delete the workspace?',
      options: ['Admin only', 'Admin and Member', 'Anyone except Viewer', 'Nobody — only Fabric admins'],
      answer: 0,
      explanation: 'Deleting the workspace and adding admins are capabilities of the Admin role only.',
      source: PERMISSIONS,
    },
    {
      kind: 'match',
      id: 'governance-endorse',
      difficulties: ['practitioner', 'expert'],
      prompt: 'Match each endorsement badge to its meaning.',
      pairs: [
        ['Promoted', 'The creators think it is ready for sharing and reuse'],
        ['Certified', 'An authorized reviewer confirmed it meets quality standards'],
        ['Master data', 'Core, single-source-of-truth data such as customer lists'],
      ],
      explanation:
        'Anyone with write permission can promote; only reviewers named by a Fabric admin can certify or apply the Master data badge.',
      source: ENDORSE,
    },
    {
      kind: 'choice',
      id: 'governance-dashboards',
      difficulties: ['beginner', 'practitioner', 'expert'],
      prompt: 'Which item type can NOT be promoted or certified?',
      options: ['Lakehouses', 'Semantic models', 'Power BI dashboards', 'Notebooks'],
      answer: 2,
      hint: 'It is a Power BI classic.',
      explanation: 'All Fabric and Power BI items except Power BI dashboards can be promoted or certified.',
      source: ENDORSE,
    },
    {
      kind: 'choice',
      id: 'governance-purview',
      difficulties: ['practitioner', 'expert'],
      prompt: 'Where do the sensitivity labels used in Fabric come from?',
      options: [
        'Each workspace defines its own',
        'Microsoft Purview Information Protection',
        'Power BI Desktop',
        'Azure DevOps',
      ],
      answer: 1,
      explanation:
        'Fabric uses sensitivity labels from Microsoft Purview Information Protection. They must be enabled in the Fabric tenant settings first.',
      source: LABELS,
    },
    {
      kind: 'choice',
      id: 'governance-certify',
      difficulties: ['practitioner', 'expert'],
      prompt: 'Who can certify an item?',
      options: [
        'Any item owner',
        'Anyone with write permission',
        'Only users specified by a Fabric administrator',
        'Only Microsoft',
      ],
      answer: 2,
      explanation:
        'Anyone can request certification, but only authorized reviewers specified by a Fabric administrator can actually certify items.',
      source: ENDORSE,
    },
    {
      kind: 'choice',
      id: 'governance-catalog',
      difficulties: ['beginner'],
      prompt: 'Where do you find endorsed items across all your workspaces?',
      options: ['The OneLake catalog', 'Windows Explorer', 'The capacity settings', 'Your inbox'],
      answer: 0,
      explanation:
        'The OneLake catalog has an Endorsed items filter that lists certified items first, then promoted items, across workspaces.',
      source: CATALOG,
    },
    {
      kind: 'dialogue',
      id: 'governance-outro',
      speaker: 'Elif, Security Officer',
      art: 'governance-shield',
      lines: ['Roles set, trusted data badged, labels on. I might sleep tonight.'],
    },
  ],
};
