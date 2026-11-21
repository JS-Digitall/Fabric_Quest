import {
  useCssTheme,
  VegaVisual,
  type VisualizationSpec,
} from '@microsoft/fabric-visuals';
import type { DataTable } from '@microsoft/fabric-visuals-core';

import type { ChartData } from '../types';

export function StoryChart({ chart }: { chart: ChartData }) {
  const theme = useCssTheme();
  const spec: VisualizationSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    description: chart.title,
    mark: { type: 'bar', cornerRadiusEnd: 6 },
    encoding: {
      x: { field: chart.x, type: 'nominal', sort: null },
      y: { field: chart.y, type: 'quantitative' },
    },
  };
  const data: DataTable = {
    columns: [
      { name: chart.x, displayName: chart.x },
      { name: chart.y, displayName: chart.y },
    ],
    rows: chart.rows.map((r) => [r[chart.x], r[chart.y]]),
  };

  return (
    <figure className="mt-500 rounded-3xl border-2 border-border bg-card p-400">
      {/* Own title: the visual's built-in header keeps a fixed light-theme text colour. */}
      <figcaption className="mb-200 flex flex-wrap items-center gap-300">
        <span className="font-heading text-400 font-bold">{chart.title}</span>
        <span className="rounded-full bg-muted px-300 py-100 text-200 font-semibold uppercase tracking-wide text-muted-foreground">
          Fictional story data
        </span>
      </figcaption>
      <VegaVisual
        spec={spec}
        data={data}
        theme={theme}
        style={{ height: 240 }}
      />
    </figure>
  );
}
