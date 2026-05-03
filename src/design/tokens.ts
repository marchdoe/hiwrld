export const T = {
  g0:      '#f7f6f3',
  g1:      '#ecebe7',
  g2:      '#dcd9d2',
  g3:      '#a8a39a',
  g4:      '#6e6a62',
  g5:      '#3d3a35',
  g6:      '#1f1d1a',
  ink:     '#3a4a6b',
  inkSoft: '#b8c2d4',
  ui:      '"Geist", "Helvetica Neue", Helvetica, Arial, sans-serif',
  mono:    '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

export type Tokens = typeof T;
