import { describe, it, expect } from 'vitest'
import { runFFTLesson, fftExample, fftMagnitude, fftMultiply, fftAdd, formatFFT, parseFFT } from './fftLessonModel'
describe('043 radix-2 FFT lesson', () => {
  it('uses the displayed two-sine formula for samples and both conjugate peaks', () => {
    const r = runFFTLesson(fftExample)
    expect(r.samples[0]).toBe(0)
    expect(r.samples[1]).toBeCloseTo(1 + Math.SQRT1_2 / 2)
    expect(r.reversal).toEqual([0, 4, 2, 6, 1, 5, 3, 7])
    expect(r.significant.map((p) => p.k)).toEqual([2, 3, 5, 6])
    expect(r.positive.map((p) => p.k)).toEqual([2, 3])
    expect(r.spectrum[2].magnitude).toBeCloseTo(4)
    expect(r.spectrum[3].magnitude).toBeCloseTo(2)
    expect(r.frames.map((f) => f.width)).toEqual([1, 2, 4, 8])
    expect(r.butterflyCount).toBe(12)
  })
  it('compares 150 generated signals with an independent direct DFT, Parseval and inverse reconstruction', () => {
    let seed = 43
    for (let t = 0; t < 150; t++) {
      const n = [2, 4, 8, 16, 32][t % 5],
        samples = Array.from({ length: n }, () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
          return ((seed % 2001) - 1000) / 100
        })
      const r = runFFTLesson({ ...fftExample, type: 'custom', size: n, samples })
      for (let k = 0; k < n; k++) {
        const re = samples.reduce((sum, x, j) => sum + x * Math.cos((2 * Math.PI * k * j) / n), 0),
          im = samples.reduce((sum, x, j) => sum - x * Math.sin((2 * Math.PI * k * j) / n), 0)
        expect(r.spectrum[k].value.re).toBeCloseTo(re, 9)
        expect(r.spectrum[k].value.im).toBeCloseTo(im, 9)
        const reconstructed =
          r.spectrum.reduce((sum, p) => sum + p.value.re * Math.cos((2 * Math.PI * p.k * k) / n) - p.value.im * Math.sin((2 * Math.PI * p.k * k) / n), 0) / n
        expect(reconstructed).toBeCloseTo(samples[k], 9)
        expect(r.spectrum[(n - k) % n].value.im).toBeCloseTo(-r.spectrum[k].value.im, 9)
      }
      expect(samples.reduce((a, x) => a + x * x, 0)).toBeCloseTo(r.spectrum.reduce((a, p) => a + p.magnitude ** 2, 0) / n, 8)
      expect(r.operations).toHaveLength((n / 2) * Math.log2(n))
    }
  })
  it('records exact butterfly certificates without mutating earlier snapshots', () => {
    const r = runFFTLesson(fftExample)
    expect(r.frames[0].values.map((c) => c.re)).toEqual(r.reversal.map((i) => r.samples[i]))
    for (const f of r.frames.slice(1))
      for (const b of f.butterflies) {
        expect(b.product).toEqual(fftMultiply(b.twiddle, b.v))
        expect(b.sum).toEqual(fftAdd(b.u, b.product))
        expect(f.values[b.upper]).toEqual(b.sum)
        expect(f.values[b.lower]).toEqual(b.difference)
        expect(fftMagnitude(b.twiddle)).toBeCloseTo(1)
      }
  })
  it('handles zero, DC, impulse, Nyquist and fractional-bin leakage', () => {
    expect(runFFTLesson({ ...fftExample, a1: 0, a2: 0 }).significant).toEqual([])
    const dc = runFFTLesson({ ...fftExample, type: 'constant', a1: 2 })
    expect(dc.significant.map((p) => p.k)).toEqual([0])
    expect(dc.spectrum[0].value.re).toBe(16)
    const impulse = runFFTLesson({ ...fftExample, type: 'impulse', a1: -2 })
    expect(impulse.spectrum.every((p) => p.value.re === -2 && p.value.im === 0)).toBe(true)
    const nyquist = runFFTLesson({ ...fftExample, type: 'custom', samples: [1, -1, 1, -1, 1, -1, 1, -1] })
    expect(nyquist.significant.map((p) => p.k)).toEqual([4])
    expect(runFFTLesson({ ...fftExample, f1: 1.5, a2: 0 }).significant.length).toBeGreaterThan(2)
  })
  it('rejects invalid parameters atomically and formats complex values consistently', () => {
    const draft = { type: 'sine' as const, size: '8', a1: '1', f1: '2', a2: '0.5', f2: '3', samples: '' }
    expect(parseFFT(draft)).toMatchObject(fftExample)
    for (const size of ['0', '3', '64', '']) expect(() => parseFFT({ ...draft, size })).toThrow()
    expect(() => parseFFT({ ...draft, a1: '' })).toThrow('Fill every')
    expect(() => parseFFT({ ...draft, f1: '5' })).toThrow('N/2')
    expect(() => parseFFT({ ...draft, a2: 'Infinity' })).toThrow('Amplitudes')
    expect(() => parseFFT({ ...draft, type: 'custom', samples: '1,2' })).toThrow('exactly 8')
    expect(() => parseFFT({ ...draft, type: 'custom', samples: '1 2 3 4 5 6 NaN 8' })).toThrow('finite')
    expect(formatFFT({ re: -1e-15, im: -2 })).toBe('-2i')
    expect(formatFFT({ re: 1, im: -2 })).toBe('1 − 2i')
    expect(formatFFT({ re: 1e-20, im: 0 })).toBe('1e-20')
    const tiny = runFFTLesson({ ...fftExample, type: 'impulse', a1: 1e-20 })
    expect(tiny.significant).toHaveLength(8)
    expect(tiny.spectrum[0].magnitude).toBe(1e-20)
  })
})
