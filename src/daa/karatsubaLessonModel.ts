export type KaratsubaNode = {
  id: string
  x: bigint
  y: bigint
  n: number
  m: number
  base: bigint
  a: bigint
  b: bigint
  c: bigint
  d: bigint
  z0: bigint
  z1: bigint
  z2: bigint
  middle: bigint
  result: bigint
  children?: [KaratsubaNode, KaratsubaNode, KaratsubaNode]
}
export type KaratsubaFrame = { node: string; kind: 'split' | 'low' | 'sum' | 'high' | 'combine' | 'base'; known: [boolean, boolean, boolean]; message: string }
export function parseKaratsubaInteger(text: string, maxDigits = 24): bigint {
  const normalized = text.trim()
  if (!/^[+-]?\d+$/.test(normalized)) throw new Error('Enter a signed whole decimal integer; fractions and exponent notation are not supported.')
  const digits = normalized.replace(/^[+-]/, '').replace(/^0+(?=\d)/, '')
  if (digits.length > maxDigits) throw new Error(`Use at most ${maxDigits} digits per integer.`)
  return BigInt(normalized)
}
export function runKaratsubaLesson(xText: string, yText: string) {
  const signedX = parseKaratsubaInteger(xText),
    signedY = parseKaratsubaInteger(yText),
    x = signedX < 0n ? -signedX : signedX,
    y = signedY < 0n ? -signedY : signedY,
    sign = signedX < 0n !== signedY < 0n ? -1n : 1n,
    nodes: KaratsubaNode[] = [],
    frames: KaratsubaFrame[] = []
  function solve(x: bigint, y: bigint, id: string): KaratsubaNode {
    const n = Math.max(String(x).length, String(y).length),
      m = Math.floor(n / 2),
      base = 10n ** BigInt(m),
      node: KaratsubaNode = { id, x, y, n, m, base, a: x / base, b: x % base, c: y / base, d: y % base, z0: 0n, z1: 0n, z2: 0n, middle: 0n, result: 0n }
    nodes.push(node)
    if (x < 10n || y < 10n) {
      node.result = x * y
      frames.push({
        node: id,
        kind: 'base',
        known: [true, true, true],
        message: `Base case: ${x} × ${y} = ${node.result}. At least one operand has one digit.`,
      })
      return node
    }
    frames.push({ node: id, kind: 'split', known: [false, false, false], message: `Split ${x} and ${y} at ${m} low digits; base = ${base}.` })
    const low = solve(node.b, node.d, id + '0')
    node.z0 = low.result
    frames.push({ node: id, kind: 'low', known: [true, false, false], message: `The low product z0 = ${node.b} × ${node.d} = ${node.z0} is ready.` })
    const sum = solve(node.a + node.b, node.c + node.d, id + '1')
    node.z1 = sum.result
    frames.push({
      node: id,
      kind: 'sum',
      known: [true, true, false],
      message: `The sum product z1 = ${node.a + node.b} × ${node.c + node.d} = ${node.z1} is ready.`,
    })
    const high = solve(node.a, node.c, id + '2')
    node.z2 = high.result
    frames.push({ node: id, kind: 'high', known: [true, true, true], message: `The high product z2 = ${node.a} × ${node.c} = ${node.z2} is ready.` })
    node.children = [low, sum, high]
    node.middle = node.z1 - node.z2 - node.z0
    node.result = node.z2 * base * base + node.middle * base + node.z0
    frames.push({
      node: id,
      kind: 'combine',
      known: [true, true, true],
      message: `Combine ${node.z2} × ${base * base} + ${node.middle} × ${base} + ${node.z0} = ${node.result}.`,
    })
    return node
  }
  const root = solve(x, y, 'P'),
    result = root.result * sign
  return { x: signedX, y: signedY, sign, root, nodes, frames, result, defaultCursor: frames.length - 1 }
}
export type KaratsubaRun = ReturnType<typeof runKaratsubaLesson>
