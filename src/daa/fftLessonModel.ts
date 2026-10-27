export type Complex = { re: number; im: number }
export type FFTInput = { type: 'sine' | 'impulse' | 'constant' | 'custom'; size: number; a1: number; f1: number; a2: number; f2: number; samples?: number[] }
export type Butterfly = {
  stage: number
  width: number
  block: number
  j: number
  upper: number
  lower: number
  exponent: number
  twiddle: Complex
  u: Complex
  v: Complex
  product: Complex
  sum: Complex
  difference: Complex
}
export const fftExample: FFTInput = { type: 'sine', size: 8, a1: 1, f1: 2, a2: 0.5, f2: 3 }
export const fftAdd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im })
export const fftMultiply = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re })
export const fftMagnitude = (a: Complex) => Math.hypot(a.re, a.im)
export function formatFFT(value: Complex, digits = 3): string {
  const tolerance = Math.max(Math.abs(value.re), Math.abs(value.im)) * 0.5 * 10 ** -digits,
    clean = (v: number) => (Math.abs(v) < tolerance ? 0 : v),
    re = clean(value.re),
    im = clean(value.im),
    number = (v: number) => (v !== 0 && Math.abs(v) < 10 ** -digits ? Number(v.toPrecision(4)).toString() : Number(v.toFixed(digits)).toString())
  if (!im) return number(re)
  if (!re) return `${number(im)}i`
  return `${number(re)} ${im < 0 ? '−' : '+'} ${number(Math.abs(im))}i`
}
export function validateFFT(input: FFTInput) {
  if (![2, 4, 8, 16, 32].includes(input.size)) throw new Error('Sample size must be 2, 4, 8, 16 or 32.')
  if (!['sine', 'impulse', 'constant', 'custom'].includes(input.type)) throw new Error('Choose a supported signal type.')
  if (input.type === 'custom') {
    if (!input.samples || input.samples.length !== input.size) throw new Error(`Enter exactly ${input.size} real samples.`)
    if (input.samples.some((v) => !Number.isFinite(v) || Math.abs(v) > 100)) throw new Error('Samples must be finite numbers between −100 and 100.')
  } else {
    if (![input.a1, input.a2].every((v) => Number.isFinite(v) && Math.abs(v) <= 10)) throw new Error('Amplitudes must be finite numbers between −10 and 10.')
    if (input.type === 'sine' && ![input.f1, input.f2].every((v) => Number.isFinite(v) && v >= 0 && v <= input.size / 2))
      throw new Error('Frequencies must be between 0 and N/2 cycles per window.')
  }
}
export function parseFFT(input: { type: FFTInput['type']; size: string; a1: string; f1: string; a2: string; f2: string; samples: string }): FFTInput {
  const required =
    input.type === 'custom' ? [input.size] : input.type === 'sine' ? [input.size, input.a1, input.f1, input.a2, input.f2] : [input.size, input.a1]
  if (required.some((v) => !v.trim())) throw new Error('Fill every required signal parameter.')
  const value: FFTInput = {
    type: input.type,
    size: Number(input.size),
    a1: Number(input.a1),
    f1: Number(input.f1),
    a2: Number(input.a2),
    f2: Number(input.f2),
    samples: input.samples.trim()
      ? input.samples
          .trim()
          .split(/[,\s]+/)
          .map(Number)
      : [],
  }
  validateFFT(value)
  return value
}
export function runFFTLesson(input: FFTInput) {
  validateFFT(input)
  const n = input.size,
    samples = Array.from({ length: n }, (_, i) =>
      input.type === 'custom'
        ? input.samples![i]
        : input.type === 'impulse'
          ? i === 0
            ? input.a1
            : 0
          : input.type === 'constant'
            ? input.a1
            : input.a1 * Math.sin((2 * Math.PI * input.f1 * i) / n) + input.a2 * Math.sin((2 * Math.PI * input.f2 * i) / n),
    ),
    bits = Math.log2(n),
    reversal = Array.from({ length: n }, (_, i) => Number.parseInt(i.toString(2).padStart(bits, '0').split('').reverse().join(''), 2)),
    state: Complex[] = reversal.map((i) => ({ re: samples[i], im: 0 })),
    frames: { stage: number; width: number; values: Complex[]; butterflies: Butterfly[] }[] = [
      { stage: 0, width: 1, values: state.map((v) => ({ ...v })), butterflies: [] },
    ],
    operations: Butterfly[] = []
  for (let stage = 1, width = 2; width <= n; stage++, width *= 2) {
    const butterflies: Butterfly[] = []
    for (let block = 0; block < n; block += width)
      for (let j = 0; j < width / 2; j++) {
        const upper = block + j,
          lower = upper + width / 2,
          angle = (-2 * Math.PI * j) / width,
          twiddle = { re: Math.cos(angle), im: Math.sin(angle) },
          u = state[upper],
          v = state[lower],
          product = fftMultiply(twiddle, v),
          sum = fftAdd(u, product),
          difference = { re: u.re - product.re, im: u.im - product.im },
          operation: Butterfly = { stage, width, block, j, upper, lower, exponent: (j * n) / width, twiddle, u, v, product, sum, difference }
        state[upper] = sum
        state[lower] = difference
        butterflies.push(operation)
        operations.push(operation)
      }
    frames.push({ stage, width, values: state.map((v) => ({ ...v })), butterflies })
  }
  const spectrum = state.map((value, k) => ({ k, value, magnitude: fftMagnitude(value), phase: Math.atan2(value.im, value.re) })),
    maxMagnitude = Math.max(...spectrum.map((p) => p.magnitude)),
    significant = spectrum.filter((p) => p.magnitude > maxMagnitude * 1e-8),
    positive = significant.filter((p) => p.k <= n / 2),
    even = samples.filter((_, i) => i % 2 === 0),
    odd = samples.filter((_, i) => i % 2 === 1)
  return {
    input: { ...input, samples: input.samples ? [...input.samples] : undefined },
    samples,
    reversal,
    frames,
    spectrum,
    significant,
    positive,
    even,
    odd,
    operations,
    butterflyCount: operations.length,
  }
}
