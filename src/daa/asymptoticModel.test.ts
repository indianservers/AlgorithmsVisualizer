import { describe, it, expect } from 'vitest'
import { asymptoticFunctions, asymptoticPlot, asymptoticRelation, asymptoticValue, polynomialCertificate, polynomialValue } from './asymptoticModel'
describe('asymptotic functions, scales and bound certificates', () => {
  it('computes actual representatives, including large exponential values without infinity', () => {
    expect(asymptoticValue('exponential', 10)).toBe(1024)
    expect(asymptoticValue('quadratic', 1000)).toBe(1000000)
    expect(asymptoticValue('nlog', 8)).toBe(24)
    expect(asymptoticValue('log', 1)).toBe(0)
    expect(Number.isFinite(asymptoticValue('exponential', 1000))).toBe(true)
  })
  it('uses honest axes, omits nonpositive logarithmic-axis samples and records clipping', () => {
    const log = asymptoticPlot(
        1000,
        'log',
        asymptoticFunctions.map((f) => f.id),
      ),
      linear = asymptoticPlot(1000, 'linear', ['quadratic'])
    expect(log.ticks).toEqual([1, 100, 10000, 1000000])
    expect(log.series.find((s) => s.id === 'exponential')!.firstOffscreen).toBe(20)
    expect(log.series.find((s) => s.id === 'log')!.points[0].n).toBe(2)
    expect(log.series.find((s) => s.id === 'quadratic')!.points[999].y).toBe(0)
    expect(log.series.find((s) => s.id === 'quadratic')!.points[99].y).not.toBe(linear.series[0].points[99].y)
    expect(log.series.find((s) => s.id === 'quadratic')!.points[99].y).toBeCloseTo(1 / 3)
    expect(linear.series[0].points[99].y).toBeCloseTo(0.99)
    for (const max of [20, 100, 1000])
      for (const scale of ['linear', 'log'] as const)
        for (const ceiling of [1e3, 1e6, 1e12]) {
          const plot = asymptoticPlot(
            max,
            scale,
            asymptoticFunctions.map((f) => f.id),
            ceiling,
          )
          for (const series of plot.series)
            for (const point of series.points) {
              expect(Number.isFinite(point.y)).toBe(true)
              expect(point.value).toBe(asymptoticValue(series.id, point.n))
            }
        }
  })
  it('distinguishes loose bounds, tight bounds and strict little-notation relationships', () => {
    expect(asymptoticRelation('linear', 'quadratic').membership).toEqual({ O: true, Ω: false, Θ: false, o: true, ω: false })
    expect(asymptoticRelation('quadratic', 'quadratic')).toMatchObject({ limit: '1', membership: { O: true, Ω: true, Θ: true, o: false, ω: false } })
    expect(asymptoticRelation('constant', 'log').limit).toBe('0')
    expect(asymptoticRelation('log', 'linear').limit).toBe('0')
    expect(asymptoticRelation('nlog', 'linear').limit).toBe('∞')
    expect(asymptoticRelation('exponential', 'quadratic').membership).toEqual({ O: false, Ω: true, Θ: false, o: false, ω: true })
  })
  it('proves the canonical bound and finds the earliest sufficient threshold for smaller constants', () => {
    const poly = { a: 3, b: 5, d: 2, p: 3 }
    expect(polynomialCertificate(poly, 10)).toMatchObject({ valid: true, n0: 1, standardC: 10 })
    expect(polynomialCertificate(poly, 5)).toMatchObject({ valid: true, n0: 2 })
    expect(polynomialCertificate(poly, 3).valid).toBe(false)
    expect(polynomialCertificate(poly, 2).valid).toBe(false)
    expect(polynomialCertificate({ a: 3, b: 0, d: 0, p: 3 }, 3)).toMatchObject({ valid: true, n0: 1 })
    expect(polynomialValue(poly, 2)).toBe(36)
    const boundary = polynomialCertificate({ a: 1, b: 1, d: 0, p: 2 }, 1.01)
    expect(boundary.n0).toBe(100)
    expect(boundary.holds(99)).toBe(false)
    expect(boundary.holds(100)).toBe(true)
  })
  it('certificates agree with independent polynomial inequalities and minimal threshold checks', () => {
    for (const p of [2, 3, 4, 5])
      for (const a of [1, 3, 20])
        for (const b of [0, 5, 20])
          for (const d of [0, 2, 20])
            for (const c of [1, 3, 5, 10, 20, 20.01, 60]) {
              const poly = { a, b, d, p },
                certificate = polynomialCertificate(poly, c)
              if (!certificate.valid) continue
              const n0 = certificate.n0!
              expect(polynomialValue(poly, n0)).toBeLessThanOrEqual(c * n0 ** p + 1e-6)
              if (n0 > 1) expect(polynomialValue(poly, n0 - 1)).toBeGreaterThan(c * (n0 - 1) ** p)
              for (const n of [n0, n0 + 1, n0 * 2, n0 * 10]) expect(polynomialValue(poly, n)).toBeLessThanOrEqual(c * n ** p + 1e-4)
            }
  })
  it('rejects invalid domains and unsupported polynomial parameters', () => {
    expect(() => asymptoticValue('log', 0)).toThrow()
    expect(() => asymptoticPlot(50, 'log', [])).toThrow()
    expect(() => polynomialCertificate({ a: 0, b: 5, d: 2, p: 3 }, 10)).toThrow()
    expect(() => polynomialCertificate({ a: 3, b: 5, d: 2, p: 3 }, 3.001)).toThrow()
    expect(() => polynomialValue({ a: 3, b: 5, d: 2, p: 3 }, NaN)).toThrow()
  })
})
