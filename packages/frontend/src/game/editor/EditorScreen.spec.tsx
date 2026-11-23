import type { SceneContentRecord } from '@rayfin-app/shared';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '@/hooks/auth.context';

vi.mock('../rpg/phaser/PhaserGame', () => ({
  PhaserGame: () => <div data-testid="phaser-world" />,
}));
vi.mock('@/lib/rayfin-client', () => ({ getRayfinClient: async () => ({}) }));
const repo = vi.hoisted(() => ({
  copyStarter: vi.fn<
    (client: unknown, chapter: { id: string }) => Promise<{
      written: number;
      failed: string[];
    }>
  >(async () => ({ written: 1, failed: [] })),
  saveScene: vi.fn(async () => {}),
}));
vi.mock('./repo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./repo')>()),
  ...repo,
}));

import { GameApp } from '../GameApp';
import { sceneToRow } from '../content/codec';
import { ContentProvider } from '../content/ContentProvider';
import { chapters } from '../content';
import type { StoredContent } from '../content/load';
import { EditorScreen } from './EditorScreen';
import { WriteRefusedError } from './repo';

const EMAIL = 'lead@example.com';
const governance = chapters.find((c) => c.id === 'governance')!;
const governanceRows: SceneContentRecord[] = governance.scenes.map((s, i) => ({
  id: `row${i}`,
  ...sceneToRow('governance', s, i),
}));

function withAuth(email: string | null, children: ReactNode) {
  const value = {
    session: email ? { user: { id: 'u', email } } : null,
  } as unknown as AuthContextValue;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function renderEditor(stored: StoredContent, load = vi.fn(async () => stored)) {
  render(
    withAuth(
      EMAIL,
      <ContentProvider load={load}>
        <EditorScreen onBack={() => {}} />
      </ContentProvider>
    )
  );
  return load;
}

const openChapter = async (title: string) =>
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(title) }));

beforeEach(() => {
  vi.stubEnv('VITE_RAYFIN_EDITOR_EMAILS', EMAIL);
  repo.copyStarter.mockClear();
  repo.saveScene.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('title screen entry', () => {
  const renderTitle = (email: string | null) =>
    render(
      withAuth(
        email,
        <ContentProvider load={async () => ({ meta: [], rows: [] })}>
          <GameApp />
        </ContentProvider>
      )
    );

  it('hides the editor from players', async () => {
    renderTitle('player@example.com');
    await screen.findByRole('heading', { name: /fabric quest/i });
    expect(
      screen.queryByRole('button', { name: /edit questions/i })
    ).not.toBeInTheDocument();
  });

  it('offers the editor to listed editors', async () => {
    renderTitle('LEAD@example.com');
    expect(
      await screen.findByRole('button', { name: /edit questions/i })
    ).toBeInTheDocument();
  });
});

describe('editor', () => {
  it('copies a starter chapter, then reloads', async () => {
    const load = renderEditor({ meta: [], rows: [] });
    await openChapter(governance.title);
    fireEvent.click(
      screen.getByRole('button', { name: /copy starter questions/i })
    );
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(repo.copyStarter).toHaveBeenCalledOnce();
  });

  it('never offers to delete a story scene', async () => {
    renderEditor({ meta: [], rows: governanceRows });
    await openChapter(governance.title);
    const intro = screen.getByRole('listitem', { name: /intro/i });
    expect(
      within(intro).queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
  });

  it('blocks saving when the correct option is removed', async () => {
    renderEditor({ meta: [], rows: governanceRows });
    await openChapter(governance.title);
    const choice = governance.scenes.find((s) => s.kind === 'choice')!;
    if (choice.kind !== 'choice') throw new Error('fixture');
    fireEvent.click(
      screen.getAllByRole('button', { name: /^edit/i })[
        governance.scenes.indexOf(choice)
      ]
    );
    const options = () => screen.getAllByRole('textbox', { name: /^option \d+$/i });
    const before = options().length;
    fireEvent.click(
      screen.getByRole('button', { name: `Remove option ${choice.answer + 1}` })
    );
    expect(options()).toHaveLength(before - 1);
    expect(
      screen.getAllByRole('radio').some((r) => (r as HTMLInputElement).checked)
    ).toBe(false);
    expect(screen.getByRole('button', { name: /^save/i })).toBeDisabled();
    expect(
      screen.getByText(/pick which option is correct/i)
    ).toBeInTheDocument();
  });

  it('keeps the edits and explains a refused save', async () => {
    repo.saveScene.mockRejectedValueOnce(new WriteRefusedError(new Error('403')));
    const load = renderEditor({ meta: [], rows: governanceRows });
    await openChapter(governance.title);
    fireEvent.click(screen.getAllByRole('button', { name: /^edit/i })[1]);
    const prompt = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.change(prompt, { target: { value: 'A brand new prompt?' } });
    fireEvent.click(screen.getByRole('button', { name: /^save/i }));
    expect(
      await screen.findByText(/not on this app’s editor list/i)
    ).toBeInTheDocument();
    // Refreshes in case part of the change landed, without closing the form.
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('textbox', { name: /prompt/i })).toHaveValue(
      'A brand new prompt?'
    );
  });

  it('copies the other chapters and points to the fix when one copy fails', async () => {
    repo.copyStarter.mockImplementation(async (_c: unknown, chapter: { id: string }) => ({
      written: 1,
      failed: chapter.id === 'ingest' ? ['ingest-x'] : [],
    }));
    const load = renderEditor({ meta: [], rows: [] });
    fireEvent.click(
      await screen.findByRole('button', { name: /copy all starter chapters/i })
    );
    expect(
      await screen.findByText(/copy missing starter questions/i)
    ).toBeInTheDocument();
    expect(repo.copyStarter).toHaveBeenCalledTimes(6);
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });
});
