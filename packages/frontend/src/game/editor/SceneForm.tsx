import {
  DIFFICULTIES,
  validateScene,
  type ChapterId,
  type ChartData,
  type DashboardScene,
  type QuestionScene,
  type Scene,
} from '@rayfin-app/shared';
import { useId, useState, type ReactNode } from 'react';

import { chapters as starter } from '../content';
import { PixelButton } from '../rpg/ui/kit';
import { KIND_LABEL } from './kinds';

const FIELD = 'px-inset w-full px-300 py-200 text-400 text-foreground';
const LABEL = 'font-pixel text-300 text-muted-foreground';

/** Illustrations the game already ships; stories can only pick from these. */
const ART_IDS = [
  ...new Set(
    starter.flatMap((c) =>
      c.scenes.flatMap((s) => (s.kind === 'dialogue' && s.art ? [s.art] : []))
    )
  ),
];

function Field({
  label,
  children,
}: {
  label: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid gap-100">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children(id)}
    </div>
  );
}

/** An editable list of rows with add/remove, e.g. options or items. */
function RowList<T>({
  noun,
  rows,
  onChange,
  blank,
  render,
}: {
  noun: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  blank: T;
  render: (row: T, i: number, set: (row: T) => void) => ReactNode;
}) {
  return (
    <div className="grid gap-200">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-200">
          {render(row, i, (next) =>
            onChange(rows.map((r, j) => (j === i ? next : r)))
          )}
          <PixelButton
            variant="ghost"
            className="shrink-0 px-200 py-100 text-300"
            aria-label={`Remove ${noun} ${i + 1}`}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            ✕
          </PixelButton>
        </div>
      ))}
      <PixelButton
        variant="ghost"
        className="justify-self-start px-300 py-100 text-300"
        onClick={() => onChange([...rows, blank])}
      >
        + Add {noun}
      </PixelButton>
    </div>
  );
}

function OptionsEditor({
  scene,
  set,
}: {
  scene: Extract<QuestionScene, { options: string[] }>;
  set: (patch: Partial<typeof scene>) => void;
}) {
  const group = useId();
  return (
    <fieldset className="grid gap-200">
      <legend className={LABEL}>Options (select the correct one)</legend>
      <RowList
        noun="option"
        rows={scene.options}
        blank=""
        onChange={(options) => {
          // Removing a row shifts the answer, or clears it if it was the answer.
          const removed = scene.options.findIndex((o, i) => options[i] !== o);
          let answer = scene.answer;
          if (options.length < scene.options.length && removed !== -1)
            answer =
              removed === answer ? -1 : removed < answer ? answer - 1 : answer;
          set({ options, answer });
        }}
        render={(option, i, setOption) => (
          <>
            <input
              type="radio"
              name={group}
              aria-label={`Option ${i + 1} is correct`}
              checked={scene.answer === i}
              onChange={() => set({ answer: i })}
            />
            <input
              className={FIELD}
              aria-label={`Option ${i + 1}`}
              value={option}
              onChange={(e) => setOption(e.target.value)}
            />
          </>
        )}
      />
    </fieldset>
  );
}

function ChartEditor({
  chart,
  set,
}: {
  chart: ChartData;
  set: (chart: ChartData) => void;
}) {
  const rows = chart.rows.map(
    (r) => [String(r[chart.x] ?? ''), Number(r[chart.y] ?? 0)] as const
  );
  const rebuild = (
    x: string,
    y: string,
    next: (readonly [string, number])[]
  ): ChartData => ({
    ...chart,
    x,
    y,
    rows: next.map(([label, value]) => ({ [x]: label, [y]: value })),
  });
  return (
    <fieldset className="grid gap-200">
      <legend className={LABEL}>Chart</legend>
      <Field label="Chart title">
        {(id) => (
          <input
            id={id}
            className={FIELD}
            value={chart.title}
            onChange={(e) => set({ ...chart, title: e.target.value })}
          />
        )}
      </Field>
      <div className="grid gap-200 sm:grid-cols-2">
        <Field label="Label column">
          {(id) => (
            <input
              id={id}
              className={FIELD}
              value={chart.x}
              onChange={(e) => set(rebuild(e.target.value, chart.y, rows))}
            />
          )}
        </Field>
        <Field label="Value column">
          {(id) => (
            <input
              id={id}
              className={FIELD}
              value={chart.y}
              onChange={(e) => set(rebuild(chart.x, e.target.value, rows))}
            />
          )}
        </Field>
      </div>
      <RowList
        noun="bar"
        rows={rows as (readonly [string, number])[]}
        blank={['', 0] as const}
        onChange={(next) => set(rebuild(chart.x, chart.y, next))}
        render={([label, value], i, setRow) => (
          <>
            <input
              className={FIELD}
              aria-label={`Bar ${i + 1} label`}
              value={label}
              onChange={(e) => setRow([e.target.value, value])}
            />
            <input
              className={`${FIELD} w-32`}
              type="number"
              aria-label={`Bar ${i + 1} value`}
              value={Number.isFinite(value) ? value : ''}
              onChange={(e) => setRow([label, e.target.valueAsNumber])}
            />
          </>
        )}
      />
    </fieldset>
  );
}

function QuestionFields({
  scene,
  set,
}: {
  scene: QuestionScene;
  set: (patch: Partial<QuestionScene>) => void;
}) {
  return (
    <>
      <Field label="Prompt">
        {(id) => (
          <textarea
            id={id}
            rows={2}
            className={FIELD}
            value={scene.prompt}
            onChange={(e) => set({ prompt: e.target.value })}
          />
        )}
      </Field>
      <fieldset className="flex flex-wrap gap-400">
        <legend className={LABEL}>Shown at</legend>
        {DIFFICULTIES.map((d) => (
          <label key={d} className="flex items-center gap-100 text-400">
            <input
              type="checkbox"
              checked={scene.difficulties.includes(d)}
              onChange={(e) =>
                set({
                  difficulties: e.target.checked
                    ? DIFFICULTIES.filter(
                        (x) => x === d || scene.difficulties.includes(x)
                      )
                    : scene.difficulties.filter((x) => x !== d),
                })
              }
            />
            {d[0].toUpperCase() + d.slice(1)}
          </label>
        ))}
      </fieldset>
      {(scene.kind === 'choice' || scene.kind === 'dashboard') && (
        <OptionsEditor scene={scene} set={set} />
      )}
      {scene.kind === 'dashboard' && (
        <ChartEditor
          chart={scene.chart}
          set={(chart) => set({ chart } as Partial<DashboardScene>)}
        />
      )}
      {scene.kind === 'arrange' && (
        <fieldset className="grid gap-200">
          <legend className={LABEL}>Items, in the correct order</legend>
          <RowList
            noun="item"
            rows={scene.items}
            blank=""
            onChange={(items) => set({ items })}
            render={(item, i, setItem) => (
              <input
                className={FIELD}
                aria-label={`Item ${i + 1}`}
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
            )}
          />
        </fieldset>
      )}
      {scene.kind === 'match' && (
        <fieldset className="grid gap-200">
          <legend className={LABEL}>Matching pairs</legend>
          <RowList
            noun="pair"
            rows={scene.pairs}
            blank={['', ''] as [string, string]}
            onChange={(pairs) => set({ pairs })}
            render={([l, r], i, setPair) => (
              <>
                <input
                  className={FIELD}
                  aria-label={`Pair ${i + 1} left`}
                  value={l}
                  onChange={(e) => setPair([e.target.value, r])}
                />
                <input
                  className={FIELD}
                  aria-label={`Pair ${i + 1} right`}
                  value={r}
                  onChange={(e) => setPair([l, e.target.value])}
                />
              </>
            )}
          />
        </fieldset>
      )}
      <Field label="Hint (optional)">
        {(id) => (
          <input
            id={id}
            className={FIELD}
            value={scene.hint ?? ''}
            onChange={(e) => set({ hint: e.target.value || undefined })}
          />
        )}
      </Field>
      <Field label="Explanation shown after answering">
        {(id) => (
          <textarea
            id={id}
            rows={3}
            className={FIELD}
            value={scene.explanation}
            onChange={(e) => set({ explanation: e.target.value })}
          />
        )}
      </Field>
      <Field label="Source link">
        {(id) => (
          <input
            id={id}
            className={FIELD}
            value={scene.source}
            onChange={(e) => set({ source: e.target.value })}
          />
        )}
      </Field>
    </>
  );
}

/** Edits one scene; Save stays disabled until the scene is playable. */
export function SceneForm({
  chapterId,
  scene,
  busy,
  error,
  onSave,
  onCancel,
}: {
  chapterId: ChapterId;
  scene: Scene;
  busy: boolean;
  error: ReactNode;
  onSave: (scene: Scene) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Scene>(scene);
  const set = (patch: Partial<Scene>) =>
    setDraft((d) => ({ ...d, ...patch }) as Scene);
  const issues = validateScene(draft, chapterId);

  return (
    <form
      className="grid gap-400"
      aria-label={`Edit ${KIND_LABEL[draft.kind]}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!issues.length) onSave(draft);
      }}
    >
      <p className="font-pixel text-400">{KIND_LABEL[draft.kind]}</p>
      {draft.kind === 'dialogue' ? (
        <>
          <Field label="Speaker">
            {(id) => (
              <input
                id={id}
                className={FIELD}
                value={draft.speaker}
                onChange={(e) => set({ speaker: e.target.value })}
              />
            )}
          </Field>
          <Field label="Lines (one per line)">
            {(id) => (
              <textarea
                id={id}
                rows={4}
                className={FIELD}
                value={draft.lines.join('\n')}
                onChange={(e) => set({ lines: e.target.value.split('\n') })}
              />
            )}
          </Field>
          <Field label="Illustration">
            {(id) => (
              <select
                id={id}
                className={FIELD}
                value={draft.art ?? ''}
                onChange={(e) => set({ art: e.target.value || undefined })}
              >
                <option value="">None</option>
                {ART_IDS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </>
      ) : (
        <QuestionFields
          scene={draft}
          set={(patch) => set(patch as Partial<Scene>)}
        />
      )}

      {issues.length > 0 && (
        <ul aria-label="Problems to fix" className="grid gap-100 text-300 text-destructive">
          {issues.map((i, n) => (
            <li key={n}>{i.message}</li>
          ))}
        </ul>
      )}
      {error && (
        <div role="alert" className="text-400 text-destructive">
          {error}
        </div>
      )}
      <div className="flex gap-300">
        <PixelButton
          type="submit"
          className="px-500 py-200"
          disabled={busy || issues.length > 0}
        >
          Save
        </PixelButton>
        <PixelButton variant="ghost" className="px-500 py-200" onClick={onCancel}>
          Cancel
        </PixelButton>
      </div>
    </form>
  );
}
