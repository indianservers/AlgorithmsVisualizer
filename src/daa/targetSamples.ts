import type { DaaInput, Edge } from './types'

const undirected = (vertices: number, pairs: Array<[number, number, number]>): DaaInput => ({
  vertices,
  directed: false,
  source: 0,
  edges: pairs.map(([from, to, weight]) => ({ from, to, weight })),
})

const lowLinkGraph = undirected(7, [
  [0, 1, 1],
  [1, 2, 1],
  [2, 0, 1],
  [0, 3, 1],
  [2, 3, 1],
  [3, 4, 1],
  [4, 5, 1],
  [5, 6, 1],
  [6, 4, 1],
])
const metricEdges: Edge[] = []
const metricPoints: [[number, number], [number, number], [number, number], [number, number], [number, number], [number, number], [number, number]] = [
  [0, 0],
  [-2, 1],
  [-1, 3],
  [1, 2],
  [3, 0],
  [4, 2],
  [2, 4],
]
for (let i = 0; i < metricPoints.length; i++)
  for (let j = i + 1; j < metricPoints.length; j++)
    metricEdges.push({
      from: i,
      to: j,
      weight: Number(Math.hypot(metricPoints[i][0] - metricPoints[j][0], metricPoints[i][1] - metricPoints[j][1]).toFixed(3)),
    })

export const targetSamples: Record<string, DaaInput> = {
  'maximum-subarray': { values: [2, -1, 3, -4, 5, -1, 2, -1] },
  'edmonds-karp': {
    vertices: 6,
    directed: true,
    source: 0,
    edges: [
      { from: 0, to: 1, weight: 16 },
      { from: 0, to: 2, weight: 13 },
      { from: 1, to: 2, weight: 10 },
      { from: 2, to: 1, weight: 4 },
      { from: 1, to: 3, weight: 12 },
      { from: 3, to: 2, weight: 9 },
      { from: 2, to: 4, weight: 14 },
      { from: 4, to: 3, weight: 7 },
      { from: 3, to: 5, weight: 20 },
      { from: 4, to: 5, weight: 4 },
    ],
  },
  'bipartite-matching': {
    vertices: 8,
    directed: false,
    edges: [
      { from: 0, to: 4, weight: 1 },
      { from: 0, to: 5, weight: 1 },
      { from: 1, to: 4, weight: 1 },
      { from: 1, to: 6, weight: 1 },
      { from: 2, to: 5, weight: 1 },
      { from: 2, to: 7, weight: 1 },
      { from: 3, to: 6, weight: 1 },
      { from: 3, to: 7, weight: 1 },
    ],
  },
  bridges: lowLinkGraph,
  'articulation-points': lowLinkGraph,
  'counting-inversions': { values: [1, 3, 5, 8, 2, 4, 6, 7] },
  'closest-pair': {
    points: [
      [4, 81],
      [10, 91],
      [13, 63],
      [18, 20],
      [22, 19],
      [25, 88],
      [29, 61],
      [31, 65],
      [36, 17],
      [40, 45],
      [52, 48],
      [57, 51],
      [61, 55],
      [69, 68],
      [84, 38],
      [97, 15],
    ],
  },
  'randomized-quicksort': { values: [7, 2, 9, 4, 3, 8, 1, 6, 5], seed: 42 },
  'randomized-selection': { values: [7, 2, 9, 4, 3, 8, 1, 6, 5], k: 5, seed: 42 },
  'vertex-cover-approximation': undirected(6, [
    [0, 1, 1],
    [0, 3, 1],
    [0, 4, 1],
    [1, 2, 1],
    [2, 4, 1],
    [3, 4, 1],
    [3, 5, 1],
    [4, 5, 1],
  ]),
  'metric-tsp-approximation': { vertices: 7, directed: false, source: 0, edges: metricEdges },
  fft: { values: [1, -0.35, 1.5, 0, -1.5, -0.35, 0.25, 1.4] },
  'bin-packing': { values: [9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1], capacity: 10 },
}

export const getTargetSample = (id: string, fallback?: DaaInput): DaaInput => structuredClone(targetSamples[id] ?? fallback ?? {})
