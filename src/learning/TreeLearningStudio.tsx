// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { MobileDisclosure } from '../components/MobileDisclosure'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, GitBranch, Lightbulb, Play, RotateCcw, SkipBack, SkipForward, Target } from 'lucide-react'
import type { AlgorithmModule, LearningTab } from '../types'
import { runTree, treeKindFor, treeLayout, type TreeAction, type TreeKind, type TreeNode, type TreeOrder } from './treeModel'
import './learning-studio.css'

type Guide = { title: string; idea: string; example: string; invariant: string; pitfall: string; task: string; answer: string; cost: string }
const guides: Record<TreeKind, Guide> = {
  bst: {
    title: 'Ordered keys, visible decisions',
    idea: 'A binary search tree sends smaller keys left and larger keys right. Each comparison removes one whole subtree from consideration.',
    example: 'Insert 8, 3, 10, 1, 6. Searching for 6 compares 8 → 3 → 6. Deleting 3 replaces it with its inorder successor when both children exist.',
    invariant: 'Every key in the left subtree is smaller than its ancestor; every key in the right subtree is larger.',
    pitfall: 'Sorted insertion can create a chain. A BST is not automatically balanced. Duplicate keys are stored once in this lab.',
    task: 'Build 1, 2, 3, 4, 5. Why does searching for 5 inspect every node?',
    answer: 'Every inserted key becomes the right child of the previous key, so the tree has height 5 and search takes O(n).',
    cost: 'Search / insert / delete O(h); worst case O(n). Storage O(n).',
  },
  traversal: {
    title: 'One tree, four ways to visit',
    idea: 'Preorder visits parent first; inorder visits between children; postorder visits parent last; level order uses a queue to visit by depth.',
    example: 'For root 8 with children 3 and 10: preorder is 8,3,10; inorder is 3,8,10; postorder is 3,10,8; level order is 8,3,10.',
    invariant: 'Every node is emitted exactly once. Inorder is sorted here because this example is built as a BST.',
    pitfall: 'Inorder traversal of an arbitrary binary tree is not necessarily sorted. The lab inserts input values as BST keys.',
    task: 'Which traversal should evaluate an expression whose operator depends on both children?',
    answer: 'Postorder: compute the left child, compute the right child, then apply the parent operator.',
    cost: 'All traversals O(n). DFS auxiliary space O(h); level-order queue O(w).',
  },
  avl: {
    title: 'Keep height under control',
    idea: 'AVL insertion and deletion follow BST rules, then restore balance at affected ancestors. A single or double rotation changes links while preserving key order.',
    example: 'Insert 30,20,10 for an LL imbalance. Insert 30,10,20 for LR: rotate the left child left, then rotate the ancestor right.',
    invariant: 'At every node, balance = left height − right height is −1, 0, or 1 after an operation.',
    pitfall: 'Balance is about subtree heights, not the difference between key values. Rotations must preserve inorder order.',
    task: 'Try 10,30,20. Which two rotations restore balance?',
    answer: 'Right-left case: rotate the right child right, then the unbalanced ancestor left. The new root is 20.',
    cost: 'Search / insert / delete O(log n). This teaching renderer recomputes heights recursively.',
  },
  redblack: {
    title: 'Balance through colors and rotations',
    idea: 'This lab uses left-leaning red-black insertion. Red links represent parts of a 2–3 tree; rotations and color flips maintain balanced black paths.',
    example: 'Insert 10,20,30. A right-leaning red link rotates left; two red children cause a color flip; the root is always made black.',
    invariant: 'Root and NIL leaves are black, no red node has a red child, and all root-to-NIL paths have equal black height. NIL leaves are implicit.',
    pitfall: 'Red-black balance does not require equal subtree heights. This lab supports insertion and search; deletion fixup is a separate operation.',
    task: 'Can a valid red-black tree have two consecutive red nodes?',
    answer: 'No. A red parent with a red child violates the red-black invariant and requires fixup.',
    cost: 'Search and insertion O(log n); storage O(n).',
  },
  heap: {
    title: 'Priority at the root',
    idea: 'A min-heap is a complete binary tree stored in an array. Insertion bubbles up; extracting the root moves the last item to the root and sifts down.',
    example: 'Insert 8,3,10,1. The minimum 1 reaches the root. Extract it and 3 becomes the next minimum after repair.',
    invariant: 'Each parent is at most either child. For index i, children are 2i+1 and 2i+2.',
    pitfall: 'Heap order is not full sorted order. The right child may be smaller than the left child.',
    task: 'Does reading a heap array from left to right produce sorted values?',
    answer: 'No. Only ancestor-to-descendant priority is guaranteed; extract repeatedly to obtain sorted order.',
    cost: 'Peek O(1); insert / extract O(log n). This lab builds by repeated insertion: O(n log n).',
  },
  trie: {
    title: 'Shared prefixes, shared paths',
    idea: 'A trie stores one character per edge step. Words with the same prefix reuse nodes; • marks a complete word.',
    example: 'Insert cat, car, care. All share c → a; car ends before care. Searching prefix ca returns all three.',
    invariant: 'The root-to-node path spells its prefix. A terminal marker distinguishes a word from a prefix.',
    pitfall: 'A prefix can exist without being a complete word. Deleting one word must preserve shared prefixes of other words.',
    task: 'After deleting car, should care still be found?',
    answer: 'Yes. Only car’s terminal status is removed; the shared c → a → r path is still needed by care.',
    cost: 'Insert / exact lookup O(k); prefix enumeration also costs the total output size.',
  },
  segment: {
    title: 'Answer ranges by combining intervals',
    idea: 'Each segment-tree node summarizes a contiguous inclusive interval. A query skips disjoint nodes, takes fully covered nodes, and splits partial overlaps.',
    example: 'For [2,4,6,8], query [1,3] takes [1,1] = 4 and [2,3] = 14, totaling 18. Setting index 2 to 10 changes the answer to 22.',
    invariant: 'Every internal sum equals the sum of its two child intervals.',
    pitfall: 'Indices here are zero-based and ranges are inclusive. This lab demonstrates point assignment, not lazy range updates.',
    task: 'Why can a fully covered interval be used without visiting its leaves?',
    answer: 'Its stored sum already represents every value in that interval, so descending would repeat work.',
    cost: 'Build O(n); query / point update O(log n). The teaching lab rebuilds the displayed snapshot after assignment.',
  },
  fenwick: {
    title: 'Jump by the lowest set bit',
    idea: 'A Fenwick tree stores overlapping prefix blocks. Prefix queries subtract lowbit(i); point updates add lowbit(i).',
    example: 'A prefix ending at zero-based index 6 starts at BIT index 7: visit 7 → 6 → 4 → 0 and add those three blocks.',
    invariant: 'BIT[i] stores the lowbit(i) values ending at one-based position i.',
    pitfall: 'Array indices are zero-based; BIT indices are one-based. A Fenwick diagram is a forest when some parent indices exceed n.',
    task: 'Which BIT positions are read for a prefix through array index 5?',
    answer: 'Start at BIT[6], add its block, then BIT[4], then stop at 0.',
    cost: 'Prefix query / point update O(log n); storage O(n). Snapshot construction is separate from query cost.',
  },
  expression: {
    title: 'Compute children before their operator',
    idea: 'An expression tree puts operators in internal nodes and numbers at leaves. Parsing respects parentheses and multiplication/division precedence.',
    example: '(3 + 5) * (8 - 2) becomes a multiplication root with two subexpressions. Postorder evaluation computes 8 × 6 = 48.',
    invariant: 'Each binary operator has exactly two ordered operands: left then right.',
    pitfall: 'Subtraction and division are not commutative. This lab accepts binary operators and positive numeric literals, not unary signs.',
    task: 'Why does 3 + 5 * 2 evaluate to 13 rather than 16?',
    answer: 'Multiplication binds more tightly. The + root has left operand 3 and right subtree 5 × 2.',
    cost: 'Parsing and evaluation O(n); storage O(n).',
  },
  btree: {
    title: 'Several keys per node, fewer levels',
    idea: 'This minimum-degree-2 B-tree stores up to three ordered keys in a node. Full nodes split, promoting the median into the parent.',
    example: 'Insert 10,20,5,6. The full [5,10,20] root splits around 10; 6 then enters the left leaf.',
    invariant: 'All leaves share a depth. A non-root node has 1–3 keys and an internal node has one more child than keys.',
    pitfall: 'This is a B-tree insertion lab. B+ trees retain data in linked leaves and need a different representation.',
    task: 'Which key is promoted when [5,10,20] splits?',
    answer: 'The median 10. The smaller key stays left and the larger key moves to the right sibling.',
    cost: 'Search / insert O(log n) node visits for fixed node capacity; storage O(n).',
  },
}

const defaultValues = [8, 3, 10, 1, 6, 14, 4, 7, 13]
const operationSteps: Record<TreeKind, string[]> = {
  bst: [
    'Compare the key with the current node.',
    'Follow the left child for a smaller key, right for a larger key.',
    'Insert at an empty child; ignore an existing key.',
    'To delete, splice a single child or replace a two-child key with its inorder successor.',
  ],
  traversal: [
    'Preorder: emit the node, recurse left, recurse right.',
    'Inorder: recurse left, emit the node, recurse right.',
    'Postorder: recurse left, recurse right, emit the node.',
    'Level order: enqueue root; repeatedly dequeue, emit, and enqueue its children.',
  ],
  avl: [
    'Insert or delete using the BST ordering rule.',
    'Compute balance = height(left) − height(right).',
    'If balance > 1, use a right rotation; first rotate the left child left for an LR case.',
    'If balance < −1, use a left rotation; first rotate the right child right for an RL case.',
    'Recompute affected heights on the return path.',
  ],
  redblack: [
    'Insert a new key as a red leaf.',
    'Rotate left when only the right link is red.',
    'Rotate right when the left link and left-left link are both red.',
    'Flip colors when both children are red.',
    'Make the root black. This is left-leaning red-black insertion.',
  ],
  heap: [
    'Append the new key at the next array position.',
    'While its key is smaller than its parent, swap upward.',
    'To extract, remove the minimum at index 0 and move the last key there.',
    'While a child is smaller, swap downward with the smaller child.',
  ],
  trie: [
    'Start at the empty-prefix root.',
    'For each character, follow or create its child.',
    'Mark the final node as a complete word.',
    'For prefix search, walk the prefix then collect all terminal descendants.',
    'For deletion, remove the terminal mark and only prune nodes not shared by another word.',
  ],
  segment: [
    'Build a node for inclusive interval [left,right].',
    'At a leaf, store the array value; otherwise split at midpoint and add child sums.',
    'Query: return 0 for no overlap, stored sum for full overlap, child sums for partial overlap.',
    'Point assignment changes a leaf and recomputes ancestors.',
  ],
  fenwick: [
    'Use one-based BIT indices; lowbit(i) = i & −i.',
    'For prefix through zero-based index k, start with i = k + 1.',
    'Add BIT[i], then i -= lowbit(i), until i = 0.',
    'For point update, apply delta to BIT[i], then i += lowbit(i), while i ≤ n.',
  ],
  expression: [
    'Tokenize numbers, parentheses and binary operators.',
    'Use an operator stack to convert infix to postfix while respecting precedence.',
    'Read postfix: push leaves; for an operator, pop right then left and attach both.',
    'Evaluate recursively in postorder; reject division by zero.',
  ],
  btree: [
    'Start at a root with at most 3 keys (minimum degree 2).',
    'Split a full root before descending.',
    'Before entering a full child, split it and promote its median.',
    'Choose the correct child interval; insert the key into its ordered leaf.',
  ],
}
function TreeSnapshot({ nodes, title }: { nodes: TreeNode[]; title: string }) {
  useLocaleRender()

  const layout = treeLayout(nodes)
  const childIds = new Set(nodes.flatMap((n) => n.children)),
    roots = nodes.filter((n) => !childIds.has(n.id))
  const depth = (id: string): number => {
    const n = nodes.find((n) => n.id === id)!
    return 1 + Math.max(0, ...n.children.map(depth))
  }
  const levels = Math.max(0, ...roots.map((n) => depth(n.id)))
  return (
    <article className="ls-snapshot">
      <h3>{tx(title, 'studios')}</h3>
      <p>
        {tx(nodes.length, 'studios')}
        {tx(' nodes · ', 'studios')}
        {tx(levels, 'studios')}
        {tx(' occupied levels', 'studios')}
      </p>
      <div className="ls-diagram-scroll">
        <svg width={layout.width} height={layout.height} role="img" aria-label={tx(title, 'studios')}>
          {tx(
            nodes.flatMap((n) =>
              n.children.map((id) => {
                const a = layout.positions.get(n.id)!,
                  b = layout.positions.get(id)!
                return <line className="ls-edge" key={`${n.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              }),
            ),
            'studios',
          )}
          {tx(
            nodes.map((n) => {
              const p = layout.positions.get(n.id)!
              return (
                <g key={n.id}>
                  <rect
                    x={p.x - 38}
                    y={p.y - 22}
                    width="76"
                    height="44"
                    rx="15"
                    fill={n.tone === 'red' ? '#a9253a' : n.tone === 'black' ? '#24354e' : 'var(--ls-soft)'}
                    stroke="var(--ls-blue)"
                  />
                  <text x={p.x} y={p.y + 5} textAnchor="middle" fill={n.tone ? '#fff' : 'var(--ls-ink)'} fontSize="15">
                    {tx(n.label, 'studios')}
                  </text>
                  {tx(
                    n.detail && (
                      <text x={p.x} y={p.y + 43} textAnchor="middle" fill="var(--ls-muted)" fontSize="12">
                        {tx(n.detail, 'studios')}
                      </text>
                    ),
                    'studios',
                  )}
                </g>
              )
            }),
            'studios',
          )}
        </svg>
      </div>
    </article>
  )
}
function TreeComparison({ values }: { values: number[] }) {
  useLocaleRender()

  return (
    <div className="ls-comparison">
      {tx(
        (['bst', 'avl'] as const).map((kind) => (
          <TreeSnapshot
            key={kind}
            title={tx(kind === 'bst' ? 'BST · same insertion order' : 'AVL · same insertion order', 'studios')}
            nodes={runTree(kind, values, [], '', { type: 'build' }).frames.at(-1)!.nodes}
          />
        )),
        'studios',
      )}
    </div>
  )
}
export function TreeLearningStudio({ module, tab = 'Visualization' }: { module: AlgorithmModule; tab?: LearningTab }) {
  useLocaleRender()

  const kind = treeKindFor(module.id),
    guide = guides[kind]
  const [draft, setDraft] = useState(
    kind === 'trie' ? 'cat, car, care, dog' : kind === 'expression' ? '(3 + 5) * (8 - 2)' : kind === 'avl' ? '30, 10, 20' : defaultValues.join(', '),
  )
  const [run, setRun] = useState(() =>
    runTree(
      kind,
      kind === 'expression' || kind === 'trie' ? [] : kind === 'avl' ? [30, 10, 20] : defaultValues,
      ['cat', 'car', 'care', 'dog'],
      '(3 + 5) * (8 - 2)',
      { type: 'build' },
    ),
  )
  const [cursor, setCursor] = useState(() => run.frames.length - 1),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [value, setValue] = useState(5),
    [queryIndex, setQueryIndex] = useState(1),
    [end, setEnd] = useState(3),
    [word, setWord] = useState('ca'),
    [order, setOrder] = useState<TreeOrder>(
      module.id.includes('preorder') ? 'preorder' : module.id.includes('postorder') ? 'postorder' : module.id.includes('level') ? 'level' : 'inorder',
    ),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(''),
    [guess, setGuess] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [expressionUsed, setExpressionUsed] = useState('(3 + 5) * (8 - 2)')
  const [saved, setSaved] = useState<{ values: number[]; words: string[]; expression: string; createdAt: string }[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(`algodrishti-tree-inputs-${module.id}`) ?? '[]')
      return Array.isArray(parsed)
        ? parsed
            .filter(
              (item) =>
                item &&
                Array.isArray(item.values) &&
                item.values.length <= 15 &&
                item.values.every((v: unknown) => typeof v === 'number' && Number.isFinite(v)) &&
                Array.isArray(item.words) &&
                item.words.every((w: unknown) => typeof w === 'string') &&
                typeof item.expression === 'string' &&
                typeof item.createdAt === 'string',
            )
            .slice(0, 5)
        : []
    } catch {
      return []
    }
  })
  const theoryOnly = tab === 'Learn',
    showInteractive = tab === 'Visualization' || tab === 'Practice'
  const frame = run.frames[cursor],
    layout = useMemo(() => treeLayout(frame.nodes), [frame.nodes]),
    last = run.frames.length - 1
  const selectedNode = frame.nodes.find((n) => n.id === selected)
  useEffect(() => {
    if (!playing || cursor >= last) return
    const timer = window.setTimeout(() => {
      setCursor((i) => Math.min(last, i + 1))
      setGuess('')
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, last, speed])
  function apply(action: TreeAction) {
    try {
      const values =
        action.type === 'build'
          ? ['trie', 'expression'].includes(kind)
            ? []
            : draft
                .split(/[\s,]+/)
                .filter(Boolean)
                .map(Number)
          : run.values
      const words = action.type === 'build' ? draft.split(/[\s,]+/).filter(Boolean) : run.words
      const next = runTree(kind, values, words, draft, action, action.type === 'build' ? undefined : run.frames.at(-1)!.nodes)
      if (kind === 'expression') setExpressionUsed(draft)
      setRun(next)
      setCursor(
        action.type === 'build'
          ? 0
          : Math.max(
              0,
              next.frames.findIndex((f) => f.message.startsWith('Compare target') || f.message.startsWith('Prefix') || f.message.startsWith('Visit')),
            ),
      )
      setPlaying(false)
      setGuess('')
      setSelected('')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check the input.')
    }
  }
  const canEdit = ['bst', 'avl', 'redblack', 'heap', 'btree', 'traversal'].includes(kind),
    range = kind === 'segment' || kind === 'fenwick'
  return (
    <section className="learning-studio tree-academy" aria-label={tx(`${module.name} learning studio`, 'studios')}>
      <header className="ls-heading">
        <div>
          <span className="ls-eyebrow">
            <GitBranch size={16} />
            {tx(' TREE WORKSHOP', 'studios')}
          </span>
          <h2>{tx(guide.title, 'studios')}</h2>
          <p>{tx(guide.idea, 'studios')}</p>
        </div>
        <span className="ls-chip">{tx(kind === 'traversal' ? '4 traversal orders' : 'Computed from your input', 'studios')}</span>
      </header>
      <div className="ls-theory-grid">
        <article>
          <BookOpen size={20} />
          <h3>{tx('Worked example', 'studios')}</h3>
          <p>{tx(guide.example, 'studios')}</p>
        </article>
        <article>
          <Target size={20} />
          <h3>{tx('Rule to preserve', 'studios')}</h3>
          <p>{tx(guide.invariant, 'studios')}</p>
        </article>
        <article>
          <Lightbulb size={20} />
          <h3>{tx('Watch out', 'studios')}</h3>
          <p>{tx(guide.pitfall, 'studios')}</p>
        </article>
      </div>
      {tx(theoryOnly && <TreeSnapshot nodes={run.frames.at(-1)!.nodes} title={tx('The worked structure', 'studios')} />, 'studios')}
      {tx(
        tab === 'Code' && (
          <div className="ls-code-guide">
            <h3>{tx('Read the operation as a sequence of decisions', 'studios')}</h3>
            <ol>
              {tx(
                operationSteps[kind].map((line, i) => <li key={i}>{tx(line, 'studios')}</li>),
                'studios',
              )}
            </ol>
            <h3>{tx('Connect the explanation to the implementation', 'studios')}</h3>
            <p>{tx(guide.invariant, 'studios')}</p>
            <p>{tx(guide.cost, 'studios')}</p>
            <p>{tx('Use the Visualization tab to test each branch with your own values, then Practice to explain the next transition.', 'studios')}</p>
          </div>
        ),
        'studios',
      )}
      {tx(
        tab === 'Experiments' && (
          <div className="ls-experiments">
            <h3>{tx('Save a reproducible example', 'studios')}</h3>
            <p>
              {tx(
                'Save the current input keys, words or expression locally. Loading an input rebuilds the structure from those values; use Export trace to retain every recorded snapshot.',
                'studios',
              )}
            </p>
            <div className="ls-operations">
              <button
                onClick={() => {
                  try {
                    const next = [{ values: run.values, words: run.words, expression: expressionUsed, createdAt: new Date().toISOString() }, ...saved].slice(
                      0,
                      5,
                    )
                    localStorage.setItem(`algodrishti-tree-inputs-${module.id}`, JSON.stringify(next))
                    setSaved(next)
                    setSaveMessage('Example saved in this browser.')
                  } catch {
                    setSaveMessage('Local storage is unavailable. Export the trace instead.')
                  }
                }}
              >
                {tx('Save tree input', 'studios')}
              </button>
              <button
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([JSON.stringify({ moduleId: module.id, kind, ...run }, null, 2)], { type: 'application/json' }))
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${module.id}-trace.json`
                  a.click()
                  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}
              >
                {tx('Export computed trace', 'studios')}
              </button>
            </div>
            {tx(saveMessage && <p role="status">{tx(saveMessage, 'studios')}</p>, 'studios')}
            {tx(
              saved.map((item, i) => (
                <article key={`${item.createdAt}-${i}`}>
                  <p>
                    {tx(new Date(item.createdAt).toLocaleString(), 'studios')} ·{tx(' ', 'studios')}
                    {tx(kind === 'trie' ? item.words.join(', ') : kind === 'expression' ? item.expression : item.values.join(', '), 'studios')}
                  </p>
                  <button
                    onClick={() => {
                      try {
                        const next = runTree(kind, item.values, item.words, item.expression, { type: 'build' })
                        setRun(next)
                        setDraft(kind === 'trie' ? item.words.join(', ') : kind === 'expression' ? item.expression : item.values.join(', '))
                        setExpressionUsed(item.expression)
                        setCursor(next.frames.length - 1)
                        setPlaying(false)
                        setSaveMessage('Saved input loaded. Open Visualization to explore it.')
                      } catch (e) {
                        setSaveMessage(e instanceof Error ? e.message : 'Could not load this example.')
                      }
                    }}
                  >
                    {tx('Load tree example ', 'studios')}
                    {tx(i + 1, 'studios')}
                  </button>
                </article>
              )),
              'studios',
            )}
          </div>
        ),
        'studios',
      )}
      {tx(
        showInteractive && (
          <>
            <div className="ls-editor problem-input-panel learning-input-panel">
              <h3 className="problem-panel-title">{tx('Problem Input', 'studios')}</h3>
              <label>
                {tx(
                  kind === 'trie' ? 'Words (comma separated)' : kind === 'expression' ? 'Arithmetic expression' : 'Keys / array values (up to 15)',
                  'studios',
                )}
                <textarea rows={4} aria-label={tx('Tree example input', 'studios')} value={draft} onChange={(e) => setDraft(e.target.value)} />
              </label>
              <button className="ls-primary" onClick={() => apply({ type: 'build' })}>
                <Play size={16} />
                {tx('Build example', 'studios')}
              </button>
              <button
                onClick={() => {
                  setCursor(0)
                  setPlaying(false)
                  setGuess('')
                }}
              >
                <RotateCcw size={16} />
                {tx('Replay', 'studios')}
              </button>
              {tx(
                ['bst', 'avl', 'traversal', 'redblack', 'btree'].includes(kind) && (
                  <div className="ls-presets">
                    <span>{tx('Try a shape', 'studios')}</span>
                    {tx(
                      [
                        ['Balanced', '8,3,10,1,6,14,4,7,13'],
                        ['Skewed', '1,2,3,4,5,6,7'],
                        ['LL', '30,20,10'],
                        ['LR', '30,10,20'],
                        ['RL', '10,30,20'],
                        ['RR', '10,20,30'],
                      ].map(([label, keys]) => (
                        <button key={label} onClick={() => setDraft(keys)}>
                          {tx(label, 'studios')}
                        </button>
                      )),
                      'studios',
                    )}
                    <small>{tx('Choose a preset, then Build example.', 'studios')}</small>
                  </div>
                ),
                'studios',
              )}
            </div>
            <div className="ls-operations">
              {tx(
                canEdit && (
                  <>
                    <label>
                      {tx('Key', 'studios')}
                      <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                    </label>
                    <button onClick={() => apply({ type: 'insert', value })}>{tx('Insert key', 'studios')}</button>
                    {tx(kind !== 'heap' && <button onClick={() => apply({ type: 'search', value })}>{tx('Search key', 'studios')}</button>, 'studios')}
                    {tx(
                      ['bst', 'avl', 'traversal'].includes(kind) && (
                        <button onClick={() => apply({ type: 'delete', value })}>{tx('Delete key', 'studios')}</button>
                      ),
                      'studios',
                    )}
                    {tx(kind === 'heap' && <button onClick={() => apply({ type: 'extract' })}>{tx('Extract minimum', 'studios')}</button>, 'studios')}
                  </>
                ),
                'studios',
              )}
              {tx(
                ['bst', 'avl', 'traversal', 'redblack'].includes(kind) && (
                  <>
                    <label>
                      {tx('Traversal', 'studios')}
                      <select aria-label={tx('Traversal order', 'studios')} value={order} onChange={(e) => setOrder(e.target.value as TreeOrder)}>
                        <option value="preorder">{tx('Preorder · root first', 'studios')}</option>
                        <option value="inorder">{tx('Inorder · between children', 'studios')}</option>
                        <option value="postorder">{tx('Postorder · root last', 'studios')}</option>
                        <option value="level">{tx('Level order · queue', 'studios')}</option>
                      </select>
                    </label>
                    <button onClick={() => apply({ type: 'traverse', order })}>{tx('Trace traversal', 'studios')}</button>
                  </>
                ),
                'studios',
              )}
              {tx(
                kind === 'trie' && (
                  <>
                    <label>
                      {tx('Word / prefix', 'studios')}
                      <input value={word} onChange={(e) => setWord(e.target.value)} />
                    </label>
                    <button onClick={() => apply({ type: 'insert', text: word })}>{tx('Insert word', 'studios')}</button>
                    <button onClick={() => apply({ type: 'search', text: word })}>{tx('Find prefix', 'studios')}</button>
                    <button onClick={() => apply({ type: 'delete', text: word })}>{tx('Delete word', 'studios')}</button>
                  </>
                ),
                'studios',
              )}
              {tx(
                range && (
                  <>
                    <label>
                      {tx(kind === 'fenwick' ? 'Prefix end / update index' : 'Start / update index', 'studios')}
                      <input type="number" value={queryIndex} onChange={(e) => setQueryIndex(Number(e.target.value))} />
                    </label>
                    {tx(
                      kind === 'segment' && (
                        <label>
                          {tx('Inclusive end', 'studios')}
                          <input type="number" value={end} onChange={(e) => setEnd(Number(e.target.value))} />
                        </label>
                      ),
                      'studios',
                    )}
                    <button onClick={() => apply({ type: 'query', index: queryIndex, end })}>
                      {tx(kind === 'fenwick' ? 'Query prefix' : 'Query range', 'studios')}
                    </button>
                    <label>
                      {tx('New value', 'studios')}
                      <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                    </label>
                    <button onClick={() => apply({ type: 'update', index: queryIndex, value })}>{tx('Assign value', 'studios')}</button>
                  </>
                ),
                'studios',
              )}
            </div>
            {tx(
              error && (
                <p className="ls-error" role="alert">
                  {tx(error, 'studios')}
                </p>
              ),
              'studios',
            )}
            <div className="ls-stage-grid">
              <div className="ls-diagram">
                <div className="ls-legend">
                  <span className="active">{tx('Active', 'studios')}</span>
                  <span>{tx('Click a node to inspect', 'studios')}</span>
                  <span>
                    {tx(frame.nodes.length, 'studios')}
                    {tx(' nodes', 'studios')}
                  </span>
                </div>
                <div className="ls-diagram-scroll">
                  <svg width={layout.width} height={layout.height} role="img" aria-label={tx(`${module.name} computed tree`, 'studios')}>
                    {tx(
                      frame.nodes.flatMap((n) =>
                        n.children.map((child) => {
                          const a = layout.positions.get(n.id)!,
                            b = layout.positions.get(child)!
                          return (
                            <line
                              key={`${n.id}-${child}`}
                              x1={a.x}
                              y1={a.y + 20}
                              x2={b.x}
                              y2={b.y - 20}
                              className={frame.active.includes(child) ? 'ls-edge active' : 'ls-edge'}
                            />
                          )
                        }),
                      ),
                      'studios',
                    )}
                    {tx(
                      frame.nodes.map((n) => {
                        const p = layout.positions.get(n.id)!
                        return (
                          <g
                            key={n.id}
                            className={`ls-node ${frame.active.includes(n.id) ? 'active' : ''} ${n.tone ?? ''} ${selected === n.id ? 'selected' : ''}`}
                          >
                            <foreignObject x={p.x - 43} y={p.y - 25} width="86" height="52">
                              <button aria-label={tx(`Inspect node ${n.label}`, 'studios')} onClick={() => setSelected(n.id)}>
                                {tx(n.label, 'studios')}
                              </button>
                            </foreignObject>
                            {tx(
                              n.detail && (
                                <text x={p.x} y={p.y + 43} textAnchor="middle">
                                  {tx(n.detail, 'studios')}
                                </text>
                              ),
                              'studios',
                            )}
                          </g>
                        )
                      }),
                      'studios',
                    )}
                  </svg>
                </div>
                <MobileDisclosure className="ls-inspector" title={tx('Inspect current state', 'studios')}>
                  {tx(
                    selectedNode ? (
                      <>
                        <strong>
                          {tx('Node ', 'studios')}
                          {tx(selectedNode.label, 'studios')}
                        </strong>
                        <span>{tx(selectedNode.detail ?? `Key ${selectedNode.label}`, 'studios')}</span>
                        <span>
                          {tx('Children: ', 'studios')}
                          {tx(selectedNode.children.map((id) => frame.nodes.find((n) => n.id === id)?.label).join(', ') || 'leaf', 'studios')}
                        </span>
                        {tx(
                          selectedNode.tone && (
                            <span>
                              {tx('Color: ', 'studios')}
                              {tx(selectedNode.tone, 'studios')}
                            </span>
                          ),
                          'studios',
                        )}
                      </>
                    ) : (
                      <span>{tx('Select any node to inspect its key, children, and stored information.', 'studios')}</span>
                    ),
                    'studios',
                  )}
                </MobileDisclosure>
              </div>
              <MobileDisclosure className="ls-trace" title={tx('Trace and explanation', 'studios')}>
                <span className="ls-eyebrow">{tx('EXPLAIN THIS STEP', 'studios')}</span>
                <h3>
                  {tx('Step ', 'studios')}
                  {tx(cursor + 1, 'studios')}
                  {tx(' of ', 'studios')}
                  {tx(last + 1, 'studios')}
                </h3>
                <p aria-live="polite">{tx(frame.message, 'studios')}</p>
                <h4>{tx(range ? 'Contributions' : kind === 'expression' ? 'Evaluation' : 'Output', 'studios')}</h4>
                <div className="ls-output">{tx(frame.output.length ? frame.output.join(' → ') : 'No values emitted yet.', 'studios')}</div>
                <h4>{tx(range ? 'Underlying array' : 'Input keys', 'studios')}</h4>
                <div className="ls-memory">
                  {tx(
                    kind === 'trie'
                      ? run.words.join(' · ')
                      : kind === 'expression'
                        ? expressionUsed
                        : run.values.map((v, i) => (
                            <span key={i}>
                              <small>{tx(i, 'studios')}</small>
                              {tx(v, 'studios')}
                            </span>
                          )),
                    'studios',
                  )}
                </div>
                <p className="ls-cost">{tx(guide.cost, 'studios')}</p>
              </MobileDisclosure>
            </div>
            <div className="ls-playback">
              <button
                aria-label={tx('Previous tree step', 'studios')}
                disabled={!cursor}
                onClick={() => {
                  setCursor((i) => i - 1)
                  setPlaying(false)
                  setGuess('')
                }}
              >
                <SkipBack size={18} />
              </button>
              <button
                aria-label={tx(playing && cursor < last ? 'Pause tree playback' : 'Play tree playback', 'studios')}
                disabled={cursor === last}
                onClick={() => setPlaying((v) => !v)}
              >
                {tx(playing && cursor < last ? 'Pause' : 'Play', 'studios')}
              </button>
              <button
                aria-label={tx('Next tree step', 'studios')}
                disabled={cursor === last}
                onClick={() => {
                  setCursor((i) => i + 1)
                  setPlaying(false)
                  setGuess('')
                }}
              >
                <SkipForward size={18} />
              </button>
              <label>
                {tx('Timeline', 'studios')}
                <input
                  aria-label={tx('Tree timeline', 'studios')}
                  type="range"
                  min="0"
                  max={last}
                  value={cursor}
                  onChange={(e) => {
                    setCursor(Number(e.target.value))
                    setPlaying(false)
                    setGuess('')
                  }}
                />
              </label>
              <label>
                {tx('Step delay', 'studios')}
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={1400}>{tx('Slow', 'studios')}</option>
                  <option value={700}>{tx('Normal', 'studios')}</option>
                  <option value={250}>{tx('Fast', 'studios')}</option>
                </select>
              </label>
            </div>
            {tx(
              cursor < last && (
                <div className="ls-prediction">
                  <h3>{tx('Predict the next explanation', 'studios')}</h3>
                  <div>
                    {tx(
                      [...new Set([run.frames[cursor + 1].message, frame.message])].sort().map((message) => (
                        <button
                          key={message}
                          onClick={() => {
                            setGuess(message)
                            setPlaying(false)
                          }}
                        >
                          {tx(message, 'studios')}
                        </button>
                      )),
                      'studios',
                    )}
                  </div>
                  {tx(
                    guess && (
                      <p role="status">
                        {tx(
                          guess === run.frames[cursor + 1].message
                            ? 'Correct. Advance one step to see it happen.'
                            : 'That describes the current state. Think about the next operation.',
                          'studios',
                        )}
                      </p>
                    ),
                    'studios',
                  )}
                </div>
              ),
              'studios',
            )}
          </>
        ),
        'studios',
      )}
      <div className="ls-challenge">
        <div>
          <span className="ls-eyebrow">{tx('TRY • EXPLAIN • VERIFY', 'studios')}</span>
          <h3>{tx(guide.task, 'studios')}</h3>
          <details>
            <summary>{tx('Reveal reasoning', 'studios')}</summary>
            <p>{tx(guide.answer, 'studios')}</p>
          </details>
        </div>
        <div>
          <h3>{tx('Compare structures', 'studios')}</h3>
          <p>
            {tx('Use the same keys in a BST and an AVL tree: ordered insertion makes the BST tall, while AVL rotations keep search paths short.', 'studios')}
          </p>
          <p>
            {tx(
              'Use a heap for repeated minimum extraction, a trie for prefixes, and segment/Fenwick trees for sums. Their ordering rules solve different problems.',
              'studios',
            )}
          </p>
          {tx(
            ['bst', 'avl', 'redblack', 'traversal'].includes(kind) && (
              <details>
                <summary>{tx('Compare BST and AVL with these keys', 'studios')}</summary>
                <TreeComparison values={run.values} />
              </details>
            ),
            'studios',
          )}
        </div>
      </div>
    </section>
  )
}
