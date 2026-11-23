import {
  DIFFICULTIES,
  MIN_QUESTIONS_PER_DIFFICULTY,
  type Chapter,
  type ChapterContentRecord,
  type QuestionScene,
  type Scene,
  type SceneContentRecord,
} from '@rayfin-app/shared';
import { useState, type ReactNode } from 'react';

import type { ContentError, ContentSource } from '../content/codec';
import { PixelButton, PixelChip } from '../rpg/ui/kit';
import {
  copyStarter,
  deleteScene,
  moveScene,
  newSceneKey,
  resetChapter,
  saveChapterMeta,
  saveScene,
  type RepoClient,
} from './repo';
import { KIND_LABEL } from './kinds';
import { SceneForm } from './SceneForm';

const FIELD = 'px-inset w-full px-300 py-200 text-400 text-foreground';

export type Run = (
  write: (client: RepoClient) => Promise<unknown>
) => Promise<boolean>;

type NewKind = Exclude<Scene['kind'], 'dialogue'>;

function blankQuestion(kind: NewKind, id: string): QuestionScene {
  const base = {
    id,
    difficulties: [...DIFFICULTIES],
    explanation: '',
    source: 'https://learn.microsoft.com/',
    prompt: '',
  };
  switch (kind) {
    case 'choice':
      return { ...base, kind, options: ['', ''], answer: 0 };
    case 'arrange':
      return { ...base, kind, items: ['', '', ''] };
    case 'match':
      return { ...base, kind, pairs: [['', ''], ['', ''], ['', '']] };
    case 'dashboard':
      return {
        ...base,
        kind,
        options: ['', ''],
        answer: 0,
        chart: { title: '', x: 'Label', y: 'Value', rows: [{ Label: '', Value: 0 }] },
      };
  }
}

const sceneLabel = (s: Scene, i: number) =>
  s.kind === 'dialogue'
    ? `${i === 0 ? 'Intro' : 'Outro'}: ${s.speaker}`
    : `${KIND_LABEL[s.kind]}: ${s.prompt}`;

/** Two-step button for actions that can't be undone. */
function Confirm({
  label,
  confirmLabel,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <PixelButton
        variant="ghost"
        className="px-300 py-100 text-300"
        aria-label={label}
        disabled={disabled}
        onClick={() => setAsking(true)}
      >
        {label.split(':')[0]}
      </PixelButton>
    );
  return (
    <span className="flex gap-200">
      <PixelButton
        className="px-300 py-100 text-300"
        disabled={disabled}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </PixelButton>
      <PixelButton
        variant="ghost"
        className="px-300 py-100 text-300"
        onClick={() => setAsking(false)}
      >
        Cancel
      </PixelButton>
    </span>
  );
}

export function ChapterPanel({
  starter,
  chapter,
  source,
  invalid,
  rows,
  meta,
  busy,
  error,
  run,
}: {
  starter: Chapter;
  chapter: Chapter | undefined;
  source: ContentSource;
  invalid: ContentError | undefined;
  rows: SceneContentRecord[];
  meta: ChapterContentRecord | undefined;
  busy: boolean;
  error: ReactNode;
  run: Run;
}) {
  const [editing, setEditing] = useState<Scene | null>(null);
  const [title, setTitle] = useState(chapter?.title ?? starter.title);
  const [tagline, setTagline] = useState(chapter?.tagline ?? starter.tagline);
  const reset = (
    <Confirm
      label="Reset chapter to starter questions"
      confirmLabel="Yes, delete saved questions"
      disabled={busy}
      onConfirm={() => void run((c) => resetChapter(c, rows, meta?.id ?? null))}
    />
  );

  if (source === 'starter')
    return (
      <section className="grid gap-400" aria-label={starter.title}>
        <h3 className="font-pixel text-500">{starter.title}</h3>
        <p className="text-400 text-foreground/90">
          This chapter plays the built-in starter questions. Copy them into the
          database to edit them.
        </p>
        <PixelButton
          className="justify-self-start px-500 py-200"
          disabled={busy}
          onClick={() =>
            void run((c) => copyStarter(c, starter, new Set(), meta?.id ?? null))
          }
        >
          Copy starter questions into the database
        </PixelButton>
        {error}
      </section>
    );

  if (!chapter)
    return (
      <section className="grid gap-400" aria-label={starter.title}>
        <h3 className="font-pixel text-500">{meta?.title ?? starter.title}</h3>
        <p className="text-400">Players can’t start the game until this is fixed:</p>
        <ul className="grid gap-100 text-400 text-destructive">
          {invalid?.issues.map((i, n) => (
            <li key={n}>
              {i.sceneKey ? `${i.sceneKey}: ` : ''}
              {i.message}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-300">
          <PixelButton
            className="px-400 py-200 text-300"
            disabled={busy}
            onClick={() =>
              void run((c) =>
                copyStarter(
                  c,
                  starter,
                  new Set(rows.map((r) => r.sceneKey)),
                  meta?.id ?? null
                )
              )
            }
          >
            Copy missing starter questions
          </PixelButton>
          {reset}
        </div>
        {error}
      </section>
    );

  if (editing)
    return (
      <SceneForm
        chapterId={chapter.id}
        scene={editing}
        busy={busy}
        error={error}
        onCancel={() => setEditing(null)}
        onSave={(scene) =>
          void run((c) => saveScene(c, chapter, rows, scene)).then(
            (ok) => ok && setEditing(null)
          )
        }
      />
    );

  const questions = chapter.scenes.filter(
    (s): s is QuestionScene => s.kind !== 'dialogue'
  );
  const last = chapter.scenes.length - 1;

  return (
    <section className="grid gap-500" aria-label={chapter.title}>
      <form
        className="grid gap-300"
        onSubmit={(e) => {
          e.preventDefault();
          void run((c) =>
            saveChapterMeta(c, chapter.id, { title, tagline }, meta?.id ?? null)
          );
        }}
      >
        <label className="grid gap-100">
          <span className="font-pixel text-300 text-muted-foreground">Title</span>
          <input className={FIELD} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="grid gap-100">
          <span className="font-pixel text-300 text-muted-foreground">Tagline</span>
          <input className={FIELD} value={tagline} maxLength={200} onChange={(e) => setTagline(e.target.value)} />
        </label>
        <PixelButton
          type="submit"
          className="justify-self-start px-400 py-100 text-300"
          disabled={busy || !title.trim() || !tagline.trim()}
        >
          Update title and tagline
        </PixelButton>
      </form>

      <ul aria-label="Questions per difficulty" className="flex flex-wrap gap-300">
        {DIFFICULTIES.map((d) => {
          const n = questions.filter((q) => q.difficulties.includes(d)).length;
          const ok = n >= MIN_QUESTIONS_PER_DIFFICULTY;
          return (
            <li key={d}>
              <PixelChip tone={ok ? 'muted' : 'gold'}>
                {d[0].toUpperCase() + d.slice(1)} {n} {ok ? '✓' : '✗'}
              </PixelChip>
            </li>
          );
        })}
      </ul>

      <ol aria-label="Scenes" className="grid gap-200">
        {chapter.scenes.map((s, i) => {
          const label = sceneLabel(s, i);
          const story = s.kind === 'dialogue';
          return (
            <li
              key={s.id}
              aria-label={label}
              className="px-inset flex flex-wrap items-center gap-300 px-300 py-200"
            >
              <span className="min-w-0 flex-1 truncate text-400">{label}</span>
              {!story && (
                <>
                  <PixelButton
                    variant="ghost"
                    className="px-200 py-100 text-300"
                    aria-label={`Move up: ${label}`}
                    disabled={busy || i <= 1}
                    onClick={() => void run((c) => moveScene(c, rows, s.id, -1))}
                  >
                    ↑
                  </PixelButton>
                  <PixelButton
                    variant="ghost"
                    className="px-200 py-100 text-300"
                    aria-label={`Move down: ${label}`}
                    disabled={busy || i >= last - 1}
                    onClick={() => void run((c) => moveScene(c, rows, s.id, 1))}
                  >
                    ↓
                  </PixelButton>
                </>
              )}
              <PixelButton
                variant="ghost"
                className="px-300 py-100 text-300"
                aria-label={`Edit: ${label}`}
                disabled={busy}
                onClick={() => setEditing(s)}
              >
                Edit
              </PixelButton>
              {!story && (
                <Confirm
                  label={`Delete: ${label}`}
                  confirmLabel="Yes, delete"
                  disabled={busy}
                  onConfirm={() =>
                    void run((c) => deleteScene(c, chapter, rows, s.id))
                  }
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-300">
        <span className="font-pixel text-300 text-muted-foreground">
          Add question:
        </span>
        {(['choice', 'arrange', 'match', 'dashboard'] as const).map((k) => (
          <PixelButton
            key={k}
            variant="ghost"
            className="px-300 py-100 text-300"
            disabled={busy}
            onClick={() =>
              setEditing(
                blankQuestion(
                  k,
                  newSceneKey(chapter.id, k, new Set(chapter.scenes.map((s) => s.id)))
                )
              )
            }
          >
            + {KIND_LABEL[k]}
          </PixelButton>
        ))}
      </div>
      {error}
      <div>{reset}</div>
    </section>
  );
}
