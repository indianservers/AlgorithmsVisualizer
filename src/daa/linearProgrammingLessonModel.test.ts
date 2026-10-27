import { describe, it, expect } from 'vitest'
import {
  lpExample,
  lpFractionalExample,
  runLPLesson,
  lpValue,
  lpFeasible,
  clipLPRegion,
  clipLPLine,
  parseLPExpression,
  parseLPInput,
  type LPInput,
} from './linearProgrammingLessonModel'
describe('046 two-variable linear programming', () => {
  it('clips x≤2 correctly and includes the integer optimum (2,2)', () => {
    const r = runLPLesson(lpExample)
    expect(r.status).toBe('optimal')
    expect(r.best).toEqual({ x: 2, y: 2 })
    expect(r.value).toBe(10)
    expect(r.vertices).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 4 },
      { x: 2, y: 2 },
    ])
    expect(r.integer.best).toEqual({ x: 2, y: 2 })
    expect(r.integer.value).toBe(10)
    expect(r.gap).toBe(0)
    expect(r.polygon.every((p) => p.x <= 2 + 1e-8)).toBe(true)
    expect(r.integer.points).toHaveLength(12)
    expect(r.dual?.map((h) => ({ row: h.row, weight: h.weight }))).toEqual([
      { row: 0, weight: 2 },
      { row: 1, weight: 1 },
    ])
  })
  it('has a genuine fractional relaxation gap without discarding feasible integer points', () => {
    const r = runLPLesson(lpFractionalExample)
    expect(r.best).toEqual({ x: 2, y: 1.5 })
    expect(r.value).toBe(9)
    expect(r.integer.best).toEqual({ x: 2, y: 1 })
    expect(r.integer.value).toBe(8)
    expect(r.gap).toBe(1)
  })
  it('checks 180 bounded instances against independent integer grids and optimality certificates', () => {
    for (let t = 0; t < 180; t++) {
      const input: LPInput = {
          sense: t % 2 ? 'max' : 'min',
          objective: { a: ((t * 7) % 13) - 6, b: ((t * 11) % 13) - 6 },
          constraints: [
            { a: 1, b: 0, op: '>=', rhs: -3 },
            { a: 0, b: 1, op: '>=', rhs: -2 },
            { a: 1, b: 0, op: '<=', rhs: 5 },
            { a: 0, b: 1, op: '<=', rhs: 6 },
            { a: 1, b: 1, op: '<=', rhs: 1 + (t % 7) },
          ],
        },
        r = runLPLesson(input),
        sign = input.sense === 'max' ? 1 : -1
      expect(r.status).toBe('optimal')
      expect(lpFeasible(input, r.best!)).toBe(true)
      expect(r.dual).not.toBeNull()
      const certificate = r.dual!
      expect(certificate.every((h) => h.weight >= 0)).toBe(true)
      expect(certificate.reduce((a, h) => a + h.a * h.weight, 0)).toBeCloseTo(sign * input.objective.a, 7)
      expect(certificate.reduce((a, h) => a + h.b * h.weight, 0)).toBeCloseTo(sign * input.objective.b, 7)
      expect(certificate.reduce((a, h) => a + h.c * h.weight, 0)).toBeCloseTo(sign * r.value!, 7)
      const grid = []
      for (let x = -3; x <= 5; x++) for (let y = -2; y <= 6; y++) if (x + y <= 1 + (t % 7)) grid.push({ x, y })
      const optimum = grid.sort((a, b) => sign * (lpValue(input, b) - lpValue(input, a)) || a.x - b.x || a.y - b.y)[0]
      expect(r.integer.best).toEqual(optimum)
      expect(r.integer.value).toBe(lpValue(input, optimum))
      expect(r.gap).toBeGreaterThanOrEqual(0)
      expect(r.polygon.every((p) => lpFeasible(input, p))).toBe(true)
    }
  })
  it('distinguishes infeasibility, unbounded objectives and bounded objectives on unbounded regions', () => {
    const impossible = runLPLesson({
      ...lpExample,
      constraints: [
        { a: 1, b: 0, op: '>=', rhs: 2 },
        { a: 1, b: 0, op: '<=', rhs: 1 },
      ],
    })
    expect(impossible.status).toBe('infeasible')
    expect(impossible.best).toBeNull()
    const unbounded = runLPLesson({ ...lpExample, constraints: lpExample.constraints.slice(2) })
    expect(unbounded.status).toBe('unbounded')
    expect(lpValue(unbounded.input, unbounded.improvingRay!)).toBeGreaterThan(0)
    expect(
      lpFeasible(unbounded.input, { x: unbounded.anchor!.x + unbounded.improvingRay!.x * 1e6, y: unbounded.anchor!.y + unbounded.improvingRay!.y * 1e6 }),
    ).toBe(true)
    const halfplane = runLPLesson({ sense: 'max', objective: { a: 1, b: 0 }, constraints: [{ a: 1, b: 0, op: '<=', rhs: 4 }] })
    expect(halfplane.status).toBe('optimal')
    expect(halfplane.value).toBe(4)
    expect(halfplane.vertices).toEqual([])
    expect(halfplane.integer.status).toBe('unbounded-region')
    expect(runLPLesson({ ...lpExample, constraints: [] }).status).toBe('unbounded')
    expect(runLPLesson({ ...lpExample, constraints: [{ a: 0, b: 0, op: '<=', rhs: -1 }] }).status).toBe('infeasible')
  })
  it('handles equality, single points, alternate optima and explicit integer search limits', () => {
    const point = runLPLesson({
      sense: 'max',
      objective: { a: 1, b: 1 },
      constraints: [
        { a: 1, b: 0, op: '=', rhs: 0.5 },
        { a: 0, b: 1, op: '=', rhs: 0.5 },
      ],
    })
    expect(point.value).toBe(1)
    expect(point.integer.status).toBe('infeasible')
    const tied = runLPLesson({ ...lpExample, objective: { a: 1, b: 1 } })
    expect(tied.optimalVertices).toHaveLength(2)
    expect(tied.value).toBe(4)
    const large = runLPLesson({
      sense: 'max',
      objective: { a: 1, b: 1 },
      constraints: [{ a: 0.01, b: 0, op: '<=', rhs: 100 }, { a: 0, b: 0.01, op: '<=', rhs: 100 }, ...lpExample.constraints.slice(2)],
    })
    expect(large.value).toBe(20000)
    expect(large.integer.status).toBe('search-limit')
    expect(large.gap).toBeNull()
    const zero = runLPLesson({ ...lpExample, objective: { a: 0, b: 0 } })
    expect(zero.value).toBe(0)
    expect(zero.dual).toEqual([])
    const repeated = runLPLesson({ ...lpExample, constraints: [...lpExample.constraints, lpExample.constraints[0]] })
    expect(repeated.vertices).toEqual(runLPLesson(lpExample).vertices)
  })
  it('parses signed expressions, validates finite bounded coefficients and clips lines honestly', () => {
    expect(parseLPExpression('−x + 0.5y')).toEqual({ a: -1, b: 0.5 })
    expect(parseLPExpression('2*x+y-y')).toEqual({ a: 2, b: 0 })
    for (const expr of ['x*y', 'x²', '3', 'x++y', 'xy', '']) expect(() => parseLPExpression(expr)).toThrow()
    expect(() => parseLPInput('max', '21x', [])).toThrow('coefficients')
    expect(() => parseLPInput('max', 'x', [{ expression: 'y', op: '<=', rhs: '' }])).toThrow('right-hand side')
    expect(() => parseLPInput('max', 'x', [{ expression: 'y', op: '<=', rhs: 'Infinity' }])).toThrow('Right-hand sides')
    const r = runLPLesson(lpExample)
    for (const row of lpExample.constraints)
      for (const p of clipLPLine(row.a, row.b, row.rhs, r.view)) expect(row.a * p.x + row.b * p.y).toBeCloseTo(row.rhs, 8)
    expect(clipLPRegion({ ...lpExample, constraints: [{ a: 0, b: 0, op: '<=', rhs: -1 }] }, r.view)).toEqual([])
  })
})
