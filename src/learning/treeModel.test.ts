import { describe, expect, it } from 'vitest'
import { runTree, treeLayout, type TreeKind, type TreeNode } from './treeModel'

const build = (kind: TreeKind, values: number[]) => runTree(kind, values, [], '(3 + 5) * (8 - 2)', { type: 'build' })
function checkBinary(nodes: TreeNode[], avl = false, rb = false) {
  const roots = nodes.filter((n) => !nodes.some((p) => p.children.includes(n.id)))
  expect(roots.length).toBe(nodes.length ? 1 : 0)
  const visit = (id: string, min: number, max: number): { height: number; black: number } => {
    const n = nodes.find((n) => n.id === id)!,
      key = Number(n.label)
    expect(key).toBeGreaterThan(min)
    expect(key).toBeLessThan(max)
    const left = n.children.find((c) => Number(c) < key),
      right = n.children.find((c) => Number(c) > key)
    const l = left ? visit(left, min, key) : { height: 0, black: 1 },
      r = right ? visit(right, key, max) : { height: 0, black: 1 }
    if (avl) expect(Math.abs(l.height - r.height)).toBeLessThanOrEqual(1)
    if (rb) {
      expect(l.black).toBe(r.black)
      if (n.tone === 'red') for (const child of n.children) expect(nodes.find((c) => c.id === child)?.tone).toBe('black')
    }
    return { height: 1 + Math.max(l.height, r.height), black: l.black + (n.tone === 'black' ? 1 : 0) }
  }
  if (roots.length) {
    if (rb) expect(roots[0].tone).toBe('black')
    visit(roots[0].id, -Infinity, Infinity)
  }
}
describe('computed tree workshop', () => {
  for (const values of [[30, 20, 10], [10, 20, 30], [30, 10, 20], [10, 30, 20], [8, 3, 10, 1, 6, 14, 4, 7, 13], Array.from({ length: 15 }, (_, i) => i)])
    it(`preserves binary ordering, AVL balance and red-black invariants for ${values}`, () => {
      for (const kind of ['bst', 'avl', 'redblack'] as const) {
        const result = build(kind, values)
        for (const frame of result.frames) checkBinary(frame.nodes, kind === 'avl', kind === 'redblack')
      }
    })
  it('deletes a two-child node and traverses the result in sorted order', () => {
    const result = runTree('bst', [8, 3, 10, 1, 6, 14], [], '', { type: 'delete', value: 3 })
    checkBinary(result.frames.at(-1)!.nodes)
    const traversal = runTree('bst', result.values, [], '', { type: 'traverse', order: 'inorder' })
    expect(traversal.frames.at(-1)!.output).toEqual(['1', '6', '8', '10', '14'])
  })
  it('rebalances AVL deletion', () => {
    for (const key of [1, 3, 8, 14]) {
      const r = runTree('avl', [8, 3, 10, 1, 6, 14, 4, 7, 13], [], '', { type: 'delete', value: key })
      checkBinary(r.frames.at(-1)!.nodes, true)
    }
  })
  it('preserves the actual edited tree across subsequent operations', () => {
    for (const kind of ['bst', 'avl'] as const) {
      const deleted = runTree(kind, [8, 3, 10, 1, 6, 14, 4, 7, 13], [], '', { type: 'delete', value: 8 })
      const nodes = deleted.frames.at(-1)!.nodes
      const searched = runTree(kind, deleted.values, [], '', { type: 'search', value: 13 }, nodes)
      expect(searched.frames[0].nodes).toEqual(nodes)
      checkBinary(searched.frames.at(-1)!.nodes, kind === 'avl')
    }
  })
  it('supports all traversal orders and empty trees', () => {
    for (const [order, expected] of [
      ['preorder', ['8', '3', '10']],
      ['inorder', ['3', '8', '10']],
      ['postorder', ['3', '10', '8']],
      ['level', ['8', '3', '10']],
    ] as const) {
      expect(runTree('traversal', [8, 3, 10], [], '', { type: 'traverse', order }).frames.at(-1)!.output).toEqual(expected)
    }
    expect(build('bst', []).frames.at(-1)!.nodes).toEqual([])
  })
  it('extracts a sorted sequence from a min-heap including duplicate and negative values', () => {
    let values = [8, -2, 3, 3, 10, 1]
    const extracted: number[] = []
    while (values.length) {
      const result = runTree('heap', values, [], '', { type: 'extract' })
      extracted.push(Number(result.frames.at(-1)!.output[0]))
      values = result.values
      for (const n of result.frames.at(-1)!.nodes)
        for (const c of n.children) expect(n.value!).toBeLessThanOrEqual(result.frames.at(-1)!.nodes.find((n) => n.id === c)!.value!)
    }
    expect(extracted).toEqual([-2, 1, 3, 3, 8, 10])
  })
  it('preserves shared trie prefixes when a word is deleted', () => {
    const removed = runTree('trie', [], ['cat', 'car', 'care'], '', { type: 'delete', text: 'car' })
    const search = runTree('trie', [], removed.words, '', { type: 'search', text: 'car' })
    expect(search.frames.at(-1)!.output).toEqual(['care'])
  })
  it('computes inclusive range sums and point assignments', () => {
    const values = [2, 4, 6, 8]
    expect(runTree('segment', values, [], '', { type: 'query', index: 1, end: 3 }).frames.at(-1)!.message).toContain('= 18')
    const updated = runTree('segment', values, [], '', { type: 'update', index: 2, value: 10 })
    expect(runTree('segment', updated.values, [], '', { type: 'query', index: 1, end: 3 }).frames.at(-1)!.message).toContain('= 22')
    expect(() => runTree('segment', values, [], '', { type: 'query', index: 3, end: 1 })).toThrow()
  })
  it('computes Fenwick prefixes with correct lowbit jumps', () => {
    const result = runTree('fenwick', [1, 2, 3, 4, 5, 6, 7, 8], [], '', { type: 'query', index: 6 })
    expect(result.frames.at(-1)!.message).toContain('= 28')
    expect(result.frames.slice(1, -1).map((f) => f.active[0])).toEqual(['7', '6', '4'])
  })
  it('builds valid B-trees with balanced leaves and bounded node capacity', () => {
    const nodes = build('btree', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).frames.at(-1)!.nodes
    const root = nodes.find((n) => !nodes.some((p) => p.children.includes(n.id)))!,
      depths: number[] = []
    const walk = (n: TreeNode, depth: number) => {
      const keys = n.label.split(' | ').map(Number)
      expect(keys.length).toBeLessThanOrEqual(3)
      expect(keys.length).toBeGreaterThanOrEqual(1)
      if (n.children.length) {
        expect(n.children.length).toBe(keys.length + 1)
        n.children.forEach((id) => walk(nodes.find((n) => n.id === id)!, depth + 1))
      } else depths.push(depth)
    }
    walk(root, 0)
    expect(new Set(depths).size).toBe(1)
  })
  it('evaluates precedence, parentheses and rejects malformed expressions', () => {
    expect(runTree('expression', [], [], '(3 + 5) * (8 - 2)', { type: 'build' }).frames.at(-1)!.message).toContain('= 48')
    expect(runTree('expression', [], [], '3 + 5 * 2', { type: 'build' }).frames.at(-1)!.message).toContain('= 13')
    for (const expr of ['1 / 0', '2 +', '(2+3', '2(3)', '-1+2', '1 2', '2^3']) expect(() => runTree('expression', [], [], expr, { type: 'build' })).toThrow()
  })
  it('positions every node in forests and skewed trees without duplicate identities', () => {
    for (const kind of ['bst', 'heap', 'trie', 'segment', 'fenwick', 'btree', 'expression'] as const) {
      const result = runTree(kind, [1, 2, 3, 4, 5], ['cat', 'car'], '2+3*4', { type: 'build' }),
        nodes = result.frames.at(-1)!.nodes,
        layout = treeLayout(nodes)
      expect(layout.positions.size).toBe(nodes.length)
      for (const p of layout.positions.values()) {
        expect(p.x).toBeGreaterThan(0)
        expect(p.y).toBeGreaterThan(0)
        expect(p.x).toBeLessThan(layout.width)
        expect(p.y).toBeLessThan(layout.height)
      }
    }
  })
})
