export type Matrix = number[][]
export type StrassenNode = {
  id: string
  a: Matrix
  b: Matrix
  result: Matrix
  products: Matrix[]
  children: StrassenNode[]
}
export const strassenExampleA: Matrix = [
  [1, 3],
  [7, 5],
]
export const strassenExampleB: Matrix = [
  [6, 8],
  [4, 2],
]
export const strassenProductFormulas = [
  '(A₁₁ + A₂₂)(B₁₁ + B₂₂)',
  '(A₂₁ + A₂₂)B₁₁',
  'A₁₁(B₁₂ − B₂₂)',
  'A₂₂(B₂₁ − B₁₁)',
  '(A₁₁ + A₁₂)B₂₂',
  '(A₂₁ − A₁₁)(B₁₁ + B₁₂)',
  '(A₁₂ − A₂₂)(B₂₁ + B₂₂)',
]
export const strassenCombineFormulas = ['M₁ + M₄ − M₅ + M₇', 'M₃ + M₅', 'M₂ + M₄', 'M₁ − M₂ + M₃ + M₆']
export function validateStrassenMatrix(value: unknown): asserts value is Matrix {
  if (
    !Array.isArray(value) ||
    ![1, 2, 4, 8].includes(value.length) ||
    value.some(
      (row) => !Array.isArray(row) || row.length !== value.length || row.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1000),
    )
  )
    throw new Error('Use square matrices of size 1, 2, 4 or 8 with finite entries between −1000 and 1000.')
}
export function matrixSum(a: Matrix, b: Matrix, sign = 1): Matrix {
  return a.map((row, i) => row.map((v, j) => v + sign * b[i][j]))
}
export function matrixQuadrants(a: Matrix): Matrix[] {
  const h = a.length / 2
  return [
    a.slice(0, h).map((r) => r.slice(0, h)),
    a.slice(0, h).map((r) => r.slice(h)),
    a.slice(h).map((r) => r.slice(0, h)),
    a.slice(h).map((r) => r.slice(h)),
  ]
}
export function strassenMultiply(a: Matrix, b: Matrix): StrassenNode {
  validateStrassenMatrix(a)
  validateStrassenMatrix(b)
  if (a.length !== b.length) throw new Error('Matrices A and B must have the same size.')
  function recurse(a: Matrix, b: Matrix, id: string): StrassenNode {
    if (a.length === 1) return { id, a, b, result: [[a[0][0] * b[0][0]]], products: [], children: [] }
    const [a11, a12, a21, a22] = matrixQuadrants(a),
      [b11, b12, b21, b22] = matrixQuadrants(b)
    const operands = [
      [matrixSum(a11, a22), matrixSum(b11, b22)],
      [matrixSum(a21, a22), b11],
      [a11, matrixSum(b12, b22, -1)],
      [a22, matrixSum(b21, b11, -1)],
      [matrixSum(a11, a12), b22],
      [matrixSum(a21, a11, -1), matrixSum(b11, b12)],
      [matrixSum(a12, a22, -1), matrixSum(b21, b22)],
    ]
    const children = operands.map(([x, y], i) => recurse(x, y, `${id}.${i + 1}`)),
      products = children.map((c) => c.result)
    const [m1, m2, m3, m4, m5, m6, m7] = products
    const c11 = matrixSum(matrixSum(matrixSum(m1, m4), m5, -1), m7),
      c12 = matrixSum(m3, m5)
    const c21 = matrixSum(m2, m4),
      c22 = matrixSum(matrixSum(matrixSum(m1, m2, -1), m3), m6)
    const result = [...c11.map((r, i) => [...r, ...c12[i]]), ...c21.map((r, i) => [...r, ...c22[i]])]
    return { id, a, b, result, products, children }
  }
  return recurse(
    a.map((r) => [...r]),
    b.map((r) => [...r]),
    'root',
  )
}
