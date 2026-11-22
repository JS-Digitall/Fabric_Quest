import {
  useCssTheme,
  VegaVisual,
  type VisualizationSpec,
} from '@microsoft/fabric-visuals';
import type { DataTable } from '@microsoft/fabric-visuals-core';

import { PixelChip } from '../rpg/ui/kit';
import type { ChartData } from '../types';

export function StoryChart({ chart }: { chart: ChartData }) {
  const theme = useCssTheme();
  const spec: VisualizationSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    description: chart.title,
    // Bright window teal: the page theme's teal is too dark on the navy battle window.
    mark: { type: 'bar', cornerRadiusEnd: 4, color: '#2bc4ad' },
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
    <figure className="px-inset mt-400 p-300">
      {/* Own title: the visual's built-in header keeps a fixed light-theme text colour. */}
      <figcaption className="mb-200 flex flex-wrap items-center gap-300">
        <span className="font-pixel text-400">{chart.title}</span>
        <PixelChip>Fictional story data</PixelChip>
      </figcaption>
      <VegaVisual
        spec={spec}
        data={data}
        theme={theme}
        // Charts only appear inside the dark battle window; the theme hook reads the
        // page root, so pin the axis ink to the window instead of the page theme.
        configVegaLite={{
          background: 'transparent',
          axis: {
            labelColor: '#b8c2d9',
            titleColor: '#f4f1e8',
            gridColor: '#3d5490',
            domainColor: '#3d5490',
            tickColor: '#3d5490',
          },
        }}
        style={{ height: 240 }}
      />
    </figure>
  );
}
