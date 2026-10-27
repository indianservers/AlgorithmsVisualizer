export type LPPoint = { x: number; y: number }
export type LPConstraint = { a: number; b: number; op: '<=' | '>=' | '='; rhs: number }
export type LPInput = { sense: 'max' | 'min'; objective: { a: number; b: number }; constraints: LPConstraint[] }
export type LPView = { xmin: number; xmax: number; ymin: number; ymax: number }
type HalfPlane = { a: number; b: number; c: number; row: number }
const EPS = 1e-8
export const lpExample: LPInput = {
  sense: 'max',
  objective: { a: 3, b: 2 },
  constraints: [
    { a: 1, b: 1, op: '<=', rhs: 4 },
    { a: 1, b: 0, op: '<=', rhs: 2 },
    { a: 1, b: 0, op: '>=', rhs: 0 },
    { a: 0, b: 1, op: '>=', rhs: 0 },
  ],
}
export const lpFractionalExample: LPInput = { ...lpExample, constraints: lpExample.constraints.map((c, i) => ({ ...c, rhs: i === 0 ? 3.5 : c.rhs })) }
export const lpValue = (input: LPInput, p: LPPoint) => input.objective.a * p.x + input.objective.b * p.y
const near = (a: number, b: number) => Math.abs(a - b) <= EPS + 64 * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))
const distinct = (points: LPPoint[]) =>
  points
    .map((p) => ({ x: Object.is(p.x, -0) ? 0 : p.x, y: Object.is(p.y, -0) ? 0 : p.y }))
    .filter((p, i) => points.findIndex((q) => near(p.x, q.x) && near(p.y, q.y)) === i)
export function lpHalfPlanes(input: LPInput): HalfPlane[] {
  return input.constraints.flatMap((c, row) =>
    c.op === '='
      ? [
          { a: c.a, b: c.b, c: c.rhs, row },
          { a: -c.a, b: -c.b, c: -c.rhs, row },
        ]
      : [{ a: c.op === '<=' ? c.a : -c.a, b: c.op === '<=' ? c.b : -c.b, c: c.op === '<=' ? c.rhs : -c.rhs, row }],
  )
}
const satisfies = (h: HalfPlane, p: LPPoint) =>
  h.a * p.x + h.b * p.y <= h.c + EPS + 64 * Number.EPSILON * (Math.abs(h.c) + Math.abs(h.a * p.x) + Math.abs(h.b * p.y))
export const lpFeasible = (input: LPInput, p: LPPoint) => lpHalfPlanes(input).every((h) => satisfies(h, p))
export function parseLPExpression(text: string) {
  const value = text.replace(/\s/g, '').replaceAll('−', '-').toLowerCase()
  if (/^[-+]?0(?:\.0*)?$/.test(value)) return { a: 0, b: 0 }
  const terms = value.match(/[+-]?(?:(?:\d+(?:\.\d*)?|\.\d+)\*?)?[xy]/g)
  if (!terms || terms.join('') !== value || terms.slice(1).some((t) => !t.startsWith('+') && !t.startsWith('-')))
    throw new Error('Use a linear expression such as x + y, 3x − 2y or 0.')
  let a = 0,
    b = 0
  for (const term of terms) {
    const raw = term.slice(0, -1).replace('*', ''),
      coefficient = raw === '' || raw === '+' ? 1 : raw === '-' ? -1 : Number(raw)
    if (term.endsWith('x')) a += coefficient
    else b += coefficient
  }
  return { a: Math.round(a * 1e10) / 1e10, b: Math.round(b * 1e10) / 1e10 }
}
export function formatLPNumber(n: number) {
  return Number((Math.abs(n) < 1e-10 ? 0 : n).toFixed(5)).toString()
}
export function formatLPExpression({ a, b }: { a: number; b: number }) {
  const pieces: string[] = []
  for (const [coefficient, variable] of [
    [a, 'x'],
    [b, 'y'],
  ] as const) {
    if (!coefficient) continue
    const magnitude = Math.abs(coefficient),
      body = `${magnitude === 1 ? '' : formatLPNumber(magnitude)}${variable}`
    pieces.push(pieces.length ? `${coefficient < 0 ? ' − ' : ' + '}${body}` : `${coefficient < 0 ? '−' : ''}${body}`)
  }
  return pieces.join('') || '0'
}
export function validateLP(input: LPInput) {
  if (!['max', 'min'].includes(input.sense)) throw new Error('Choose Maximize or Minimize.')
  const coefficient = (n: number) => Number.isFinite(n) && Math.abs(n) <= 20 && near(n * 100, Math.round(n * 100))
  if (!coefficient(input.objective.a) || !coefficient(input.objective.b))
    throw new Error('Objective coefficients must be between −20 and 20 with at most two decimal places.')
  if (input.constraints.length > 8) throw new Error('Use at most eight constraints.')
  for (const c of input.constraints) {
    if (!coefficient(c.a) || !coefficient(c.b)) throw new Error('Constraint coefficients must be between −20 and 20 with at most two decimal places.')
    if (!['<=', '>=', '='].includes(c.op)) throw new Error('Choose ≤, ≥ or = for each constraint.')
    if (!Number.isFinite(c.rhs) || Math.abs(c.rhs) > 100 || !near(c.rhs * 100, Math.round(c.rhs * 100)))
      throw new Error('Right-hand sides must be between −100 and 100 with at most two decimal places.')
  }
}
export function parseLPInput(sense: LPInput['sense'], objective: string, rows: { expression: string; op: LPConstraint['op']; rhs: string }[]): LPInput {
  const input = {
    sense,
    objective: parseLPExpression(objective),
    constraints: rows.map((row) => {
      if (!row.rhs.trim()) throw new Error('Enter a right-hand side for every constraint.')
      return { ...parseLPExpression(row.expression), op: row.op, rhs: Number(row.rhs) }
    }),
  }
  validateLP(input)
  return input
}
export function clipLPRegion(input: LPInput, view: LPView) {
  let polygon: LPPoint[] = [
    { x: view.xmin, y: view.ymin },
    { x: view.xmax, y: view.ymin },
    { x: view.xmax, y: view.ymax },
    { x: view.xmin, y: view.ymax },
  ]
  for (const h of lpHalfPlanes(input)) {
    const next: LPPoint[] = []
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % polygon.length],
        insideA = satisfies(h, a),
        insideB = satisfies(h, b)
      if (insideA) next.push(a)
      if (insideA !== insideB) {
        const denominator = h.a * (b.x - a.x) + h.b * (b.y - a.y)
        if (Math.abs(denominator) > 1e-14) {
          const t = (h.c - h.a * a.x - h.b * a.y) / denominator
          next.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
        }
      }
    }
    polygon = distinct(next)
  }
  return polygon
}
export function clipLPLine(a: number, b: number, rhs: number, view: LPView) {
  const points: LPPoint[] = []
  if (b !== 0)
    for (const x of [view.xmin, view.xmax]) {
      const y = (rhs - a * x) / b
      if (y >= view.ymin - EPS && y <= view.ymax + EPS) points.push({ x, y })
    }
  if (a !== 0)
    for (const y of [view.ymin, view.ymax]) {
      const x = (rhs - b * y) / a
      if (x >= view.xmin - EPS && x <= view.xmax + EPS) points.push({ x, y })
    }
  return distinct(points).slice(0, 2)
}
function dualCertificate(input: LPInput, point: LPPoint, planes: HalfPlane[]) {
  const sign = input.sense === 'max' ? 1 : -1,
    target = { a: sign * input.objective.a, b: sign * input.objective.b },
    active = planes.filter((h) => near(h.a * point.x + h.b * point.y, h.c))
  if (target.a === 0 && target.b === 0) return []
  for (const h of active) {
    const norm = h.a * h.a + h.b * h.b
    if (!norm) continue
    const weight = (h.a * target.a + h.b * target.b) / norm
    if (weight >= -EPS && near(weight * h.a, target.a) && near(weight * h.b, target.b)) return [{ ...h, weight: Math.max(0, weight) }]
  }
  for (let i = 0; i < active.length; i++)
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i],
        b = active[j],
        det = a.a * b.b - b.a * a.b
      if (Math.abs(det) < 1e-12) continue
      const u = (target.a * b.b - target.b * b.a) / det,
        v = (a.a * target.b - a.b * target.a) / det
      if (u >= -EPS && v >= -EPS)
        return [
          { ...a, weight: Math.max(0, u) },
          { ...b, weight: Math.max(0, v) },
        ]
    }
  return null
}
export function runLPLesson(input: LPInput) {
  validateLP(input)
  const planes = lpHalfPlanes(input),
    intersections: LPPoint[] = [],
    projections: LPPoint[] = [],
    directions: LPPoint[] = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: input.objective.a, y: input.objective.b },
      { x: -input.objective.a, y: -input.objective.b },
    ]
  for (const h of planes) {
    const norm = h.a * h.a + h.b * h.b
    if (norm) {
      projections.push({ x: (h.c * h.a) / norm, y: (h.c * h.b) / norm })
      directions.push({ x: -h.b, y: h.a }, { x: h.b, y: -h.a })
    }
  }
  for (let i = 0; i < planes.length; i++)
    for (let j = i + 1; j < planes.length; j++) {
      const a = planes[i],
        b = planes[j],
        det = a.a * b.b - b.a * a.b
      if (Math.abs(det) < 1e-12) continue
      intersections.push({ x: (a.c * b.b - b.c * a.b) / det, y: (a.a * b.c - b.a * a.c) / det })
    }
  const allIntersections = distinct(intersections),
    vertices = allIntersections.filter((p) => planes.every((h) => satisfies(h, p))).sort((a, b) => a.x + a.y - b.x - b.y || a.x - b.x || a.y - b.y),
    feasibleCandidates = distinct([{ x: 0, y: 0 }, ...projections, ...vertices]).filter((p) => planes.every((h) => satisfies(h, p))),
    anchor = feasibleCandidates[0] ?? null,
    rays = distinct(
      directions
        .filter((d) => Math.hypot(d.x, d.y) > 1e-12)
        .map((d) => {
          const length = Math.hypot(d.x, d.y)
          return { x: d.x / length, y: d.y / length }
        }),
    ).filter((d) => planes.every((h) => h.a * d.x + h.b * d.y <= EPS)),
    sign = input.sense === 'max' ? 1 : -1,
    improvingRay = anchor ? (rays.find((d) => sign * lpValue(input, d) > EPS) ?? null) : null,
    status = !anchor ? 'infeasible' : improvingRay ? 'unbounded' : 'optimal',
    best = status === 'optimal' ? [...feasibleCandidates].sort((a, b) => sign * (lpValue(input, b) - lpValue(input, a)) || a.x - b.x || a.y - b.y)[0] : null,
    value = best ? lpValue(input, best) : null,
    optimalVertices = best ? vertices.filter((p) => near(lpValue(input, p), value!)) : [],
    dual = best ? dualCertificate(input, best, planes) : null,
    boundedRegion = !!anchor && rays.length === 0,
    intercepts = planes.flatMap((h) => [...(h.a ? [{ x: h.c / h.a, y: 0 }] : []), ...(h.b ? [{ x: 0, y: h.c / h.b }] : [])]),
    displayPoints = [
      { x: 0, y: 0 },
      ...vertices,
      ...intercepts,
      ...(anchor ? [anchor] : []),
      ...rays.map((d) => ({ x: (anchor?.x ?? 0) + d.x * 4, y: (anchor?.y ?? 0) + d.y * 4 })),
    ],
    minX = Math.min(...displayPoints.map((p) => p.x)),
    maxX = Math.max(...displayPoints.map((p) => p.x)),
    minY = Math.min(...displayPoints.map((p) => p.y)),
    maxY = Math.max(...displayPoints.map((p) => p.y)),
    rangeX = Math.max(1, maxX - minX),
    rangeY = Math.max(1, maxY - minY),
    view: LPView = { xmin: minX < 0 ? minX - rangeX * 0.2 : 0, xmax: maxX + rangeX * 0.9, ymin: minY < 0 ? minY - rangeY * 0.2 : 0, ymax: maxY + rangeY * 0.3 }
  const integer: {
    status: 'optimal' | 'infeasible' | 'unbounded-region' | 'search-limit'
    points: LPPoint[]
    best: LPPoint | null
    value: number | null
    gridSize: number
  } = { status: !anchor ? 'infeasible' : !boundedRegion ? 'unbounded-region' : 'search-limit', points: [], best: null, value: null, gridSize: 0 }
  if (anchor && boundedRegion && vertices.length) {
    const xmin = Math.ceil(Math.min(...vertices.map((p) => p.x)) - EPS),
      xmax = Math.floor(Math.max(...vertices.map((p) => p.x)) + EPS),
      ymin = Math.ceil(Math.min(...vertices.map((p) => p.y)) - EPS),
      ymax = Math.floor(Math.max(...vertices.map((p) => p.y)) + EPS)
    integer.gridSize = Math.max(0, xmax - xmin + 1) * Math.max(0, ymax - ymin + 1)
    if (integer.gridSize <= 40000) {
      for (let x = xmin; x <= xmax; x++) for (let y = ymin; y <= ymax; y++) if (planes.every((h) => satisfies(h, { x, y }))) integer.points.push({ x, y })
      integer.best = [...integer.points].sort((a, b) => sign * (lpValue(input, b) - lpValue(input, a)) || a.x - b.x || a.y - b.y)[0] ?? null
      integer.status = integer.best ? 'optimal' : 'infeasible'
      integer.value = integer.best ? lpValue(input, integer.best) : null
    }
  }
  const gap = value !== null && integer.value !== null ? Math.max(0, sign * (value - integer.value)) : null
  return {
    input: { sense: input.sense, objective: { ...input.objective }, constraints: input.constraints.map((c) => ({ ...c })) },
    status,
    best,
    value,
    vertices,
    allIntersections,
    anchor,
    rays,
    improvingRay,
    optimalVertices,
    dual,
    boundedRegion,
    view,
    polygon: clipLPRegion(input, view),
    integer,
    gap,
  }
}
