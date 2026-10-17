export type TreeNode = { id: string; label: string; children: string[]; detail?: string; tone?: 'red' | 'black'; value?: number }
export type TreeFrame = { nodes: TreeNode[]; active: string[]; message: string; output: string[] }
export type TreeKind = 'bst' | 'avl' | 'redblack' | 'heap' | 'trie' | 'segment' | 'fenwick' | 'expression' | 'btree' | 'traversal'
export type TreeOrder = 'preorder' | 'inorder' | 'postorder' | 'level'
export type TreeAction = {
  type: 'build' | 'insert' | 'delete' | 'search' | 'query' | 'update' | 'extract' | 'traverse'
  value?: number
  index?: number
  end?: number
  text?: string
  order?: TreeOrder
}
export type TreeResult = { frames: TreeFrame[]; values: number[]; words: string[] }
type Binary = { key: number; left?: Binary; right?: Binary; red?: boolean }

export const treeKindFor = (id: string): TreeKind => {
  if (id.includes('avl')) return 'avl'
  if (id.includes('red-black')) return 'redblack'
  if (id.includes('heap')) return 'heap'
  if (id.includes('trie')) return 'trie'
  if (id.includes('segment')) return 'segment'
  if (id.includes('fenwick')) return 'fenwick'
  if (id.includes('expression')) return 'expression'
  if (id.includes('b-tree')) return 'btree'
  if (id.includes('traversal') || id === 'tree-algorithms-suite') return 'traversal'
  return 'bst'
}
export const isTreeLearningModule = (m: { id: string; visualMode: string }) =>
  m.visualMode === 'Tree' ||
  ['tree-algorithms-suite', 'heap-priority-queue-operations', 'trie-prefix-tree', 'segment-tree', 'fenwick-tree', 'b-tree-b-plus-tree'].includes(m.id)
const height = (n?: Binary): number => (n ? 1 + Math.max(height(n.left), height(n.right)) : 0)
const rotateLeft = (n: Binary): Binary => {
  const r = n.right!
  n.right = r.left
  r.left = n
  r.red = n.red
  n.red = true
  return r
}
const rotateRight = (n: Binary): Binary => {
  const l = n.left!
  n.left = l.right
  l.right = n
  l.red = n.red
  n.red = true
  return l
}
const rebalance = (n: Binary, event?: (message: string, key: number) => void): Binary => {
  const balance = height(n.left) - height(n.right)
  if (balance > 1) {
    if (height(n.left?.left) < height(n.left?.right)) {
      event?.(`Rotate left at ${n.left!.key}, then right at ${n.key}: LR repair.`, n.key)
      n.left = rotateLeft(n.left!)
    } else event?.(`Rotate right at ${n.key}: LL repair.`, n.key)
    return rotateRight(n)
  }
  if (balance < -1) {
    if (height(n.right?.right) < height(n.right?.left)) {
      event?.(`Rotate right at ${n.right!.key}, then left at ${n.key}: RL repair.`, n.key)
      n.right = rotateRight(n.right!)
    } else event?.(`Rotate left at ${n.key}: RR repair.`, n.key)
    return rotateLeft(n)
  }
  return n
}
const binaryNodes = (root: Binary | undefined, kind: TreeKind): TreeNode[] => {
  if (!root) return []
  return [
    {
      id: String(root.key),
      label: String(root.key),
      value: root.key,
      children: [root.left, root.right].filter((x): x is Binary => !!x).map((n) => String(n.key)),
      detail: kind === 'avl' ? `height ${height(root)} · balance ${height(root.left) - height(root.right)}` : undefined,
      tone: kind === 'redblack' ? (root.red ? 'red' : 'black') : undefined,
    },
    ...binaryNodes(root.left, kind),
    ...binaryNodes(root.right, kind),
  ]
}
const insertBinary = (root: Binary | undefined, key: number, kind: TreeKind, event?: (message: string, key: number) => void): Binary => {
  if (!root) {
    event?.(`Create leaf ${key}.`, key)
    return { key, red: true }
  }
  event?.(`Compare ${key} with ${root.key}: ${key < root.key ? 'go left' : key > root.key ? 'go right' : 'key already exists'}.`, root.key)
  if (key < root.key) root.left = insertBinary(root.left, key, kind, event)
  else if (key > root.key) root.right = insertBinary(root.right, key, kind, event)
  if (kind === 'avl') return rebalance(root, event)
  if (kind === 'redblack') {
    if (root.right?.red && !root.left?.red) {
      event?.(`Rotate left at ${root.key}: remove a right-leaning red link.`, root.key)
      root = rotateLeft(root)
    }
    if (root.left?.red && root.left.left?.red) {
      event?.(`Rotate right at ${root.key}: repair two consecutive left red links.`, root.key)
      root = rotateRight(root)
    }
    if (root.left?.red && root.right?.red) {
      event?.(`Recolor ${root.key} and its two red children to split a temporary 4-node.`, root.key)
      root.red = !root.red
      root.left.red = false
      root.right.red = false
    }
  }
  return root
}
const removeBinary = (root: Binary | undefined, key: number, kind: TreeKind): Binary | undefined => {
  if (!root) return undefined
  if (key < root.key) root.left = removeBinary(root.left, key, kind)
  else if (key > root.key) root.right = removeBinary(root.right, key, kind)
  else {
    if (!root.left) return root.right
    if (!root.right) return root.left
    let successor = root.right
    while (successor.left) successor = successor.left
    root.key = successor.key
    root.right = removeBinary(root.right, successor.key, kind)
  }
  return kind === 'avl' ? rebalance(root) : root
}

export function runTree(
  kind: TreeKind,
  rawValues: number[],
  rawWords: string[],
  expression: string,
  action: TreeAction,
  previousNodes?: TreeNode[],
): TreeResult {
  if (rawValues.length > 15 || rawValues.some((v) => !Number.isFinite(v))) throw new Error('Use at most 15 finite numbers.')
  let values = [...rawValues],
    words = [...rawWords]
  const frames: TreeFrame[] = [],
    output: string[] = []
  const emit = (nodes: TreeNode[], message: string, active: string[] = []) =>
    frames.push({ nodes: structuredClone(nodes), message, active, output: [...output] })
  const value = action.value ?? 0
  if (!Number.isFinite(value)) throw new Error('Enter a finite numeric value.')
  if (kind === 'bst' || kind === 'avl' || kind === 'redblack' || kind === 'traversal') {
    const binaryKind = kind === 'traversal' ? 'bst' : kind
    let root: Binary | undefined
    const buildValues = [...new Set(values)]
    if (previousNodes && action.type !== 'build') {
      const restore = (node: TreeNode): Binary => ({
        key: Number(node.label),
        red: node.tone === 'red',
        left: node.children
          .map((id) => previousNodes.find((n) => n.id === id)!)
          .filter((n) => n.value! < node.value!)
          .map(restore)[0],
        right: node.children
          .map((id) => previousNodes.find((n) => n.id === id)!)
          .filter((n) => n.value! > node.value!)
          .map(restore)[0],
      })
      const previousRoot = previousNodes.find((n) => !previousNodes.some((p) => p.children.includes(n.id)))
      root = previousRoot ? restore(previousRoot) : undefined
      emit(binaryNodes(root, binaryKind), 'Begin with the current tree.')
    }
    for (const key of previousNodes && action.type !== 'build' ? [] : buildValues) {
      const repairs: string[] = []
      root = insertBinary(root, key, binaryKind, (message) => {
        if (message.startsWith('Rotate') || message.startsWith('Recolor')) repairs.push(message)
      })
      root.red = false
      emit(
        binaryNodes(root, binaryKind),
        `Insert ${key}${kind === 'avl' ? '; recompute heights and restore balance' : kind === 'redblack' ? '; rotate/recolor and make the root black' : ' using the BST ordering rule'}. ${repairs.join(' ')}`.trim(),
        [String(key)],
      )
    }
    values = buildValues
    if (action.type !== 'build') frames.splice(0, Math.max(0, frames.length - 1))
    if (action.type === 'insert') {
      if (values.length >= 15 && !values.includes(value)) throw new Error('The interactive tree supports at most 15 distinct keys.')
      root = insertBinary(root, value, binaryKind, (message, key) => emit(binaryNodes(root, binaryKind), message, [String(key)]))
      root.red = false
      values = [...new Set([...values, value])]
      emit(
        binaryNodes(root, binaryKind),
        `Insertion complete. ${kind === 'avl' ? 'Every balance factor is between −1 and 1.' : kind === 'redblack' ? 'Root is black; red links lean left and every root-to-NIL path has equal black height.' : 'All left keys are smaller; all right keys are larger.'}`,
        [String(value)],
      )
    } else if (action.type === 'delete') {
      if (kind === 'redblack') throw new Error('This red-black lesson demonstrates insertion and search; deletion fixup is not part of this lab.')
      const existed = values.includes(value)
      root = removeBinary(root, value, binaryKind)
      values = values.filter((v) => v !== value)
      emit(
        binaryNodes(root, binaryKind),
        existed
          ? `Delete ${value}. For a node with two children, replace it with its inorder successor.${kind === 'avl' ? ' Rebalance the affected ancestors.' : ''}`
          : `${value} is absent; the tree is unchanged.`,
      )
    } else if (action.type === 'search') {
      let n = root
      while (n) {
        emit(binaryNodes(root, binaryKind), `Compare target ${value} with ${n.key}.`, [String(n.key)])
        if (n.key === value) break
        n = value < n.key ? n.left : n.right
      }
      emit(binaryNodes(root, binaryKind), n ? `Found ${value}.` : `${value} is absent: reached an empty child.`, n ? [String(n.key)] : [])
    } else if (action.type === 'traverse') {
      const order = action.order ?? 'inorder'
      const visit = (n?: Binary) => {
        if (!n) return
        if (order === 'preorder') record(n)
        visit(n.left)
        if (order === 'inorder') record(n)
        visit(n.right)
        if (order === 'postorder') record(n)
      }
      const record = (n: Binary) => {
        output.push(String(n.key))
        emit(binaryNodes(root, binaryKind), `Visit ${n.key} in ${order} order.`, [String(n.key)])
      }
      if (order === 'level') {
        const queue = root ? [root] : []
        for (let i = 0; i < queue.length; i++) {
          record(queue[i])
          if (queue[i].left) queue.push(queue[i].left!)
          if (queue[i].right) queue.push(queue[i].right!)
        }
      } else visit(root)
    }
  } else if (kind === 'heap') {
    const heap: number[] = []
    const nodes = () =>
      heap.map(
        (v, i): TreeNode => ({
          id: String(i),
          label: String(v),
          value: v,
          detail: `array[${i}]`,
          children: [i * 2 + 1, i * 2 + 2].filter((j) => j < heap.length).map(String),
        }),
      )
    const push = (v: number) => {
      heap.push(v)
      let i = heap.length - 1
      emit(nodes(), `Append ${v} at index ${i}.`, [String(i)])
      while (i > 0) {
        const p = Math.floor((i - 1) / 2)
        if (heap[p] <= heap[i]) break
        ;[heap[p], heap[i]] = [heap[i], heap[p]]
        emit(nodes(), 'Bubble the smaller key above its parent.', [String(i), String(p)])
        i = p
      }
    }
    values.forEach(push)
    if (action.type !== 'build') frames.splice(0, Math.max(0, frames.length - 1))
    if (action.type === 'insert') {
      if (values.length >= 15) throw new Error('Use at most 15 heap items.')
      push(value)
    }
    if (action.type === 'extract') {
      if (!heap.length) throw new Error('The heap is empty; there is no minimum to extract.')
      const min = heap[0],
        last = heap.pop()!
      if (heap.length) {
        heap[0] = last
        let i = 0
        while (true) {
          let smallest = i
          for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && heap[c] < heap[smallest]) smallest = c
          if (smallest === i) break
          ;[heap[i], heap[smallest]] = [heap[smallest], heap[i]]
          emit(nodes(), 'Sift down toward the smaller child.', [String(i), String(smallest)])
          i = smallest
        }
      }
      output.push(String(min))
      emit(nodes(), `Extract minimum ${min}. The remaining structure is a min-heap.`)
    }
    values = [...heap]
    emit(nodes(), 'Heap invariant: every parent is at most either child. The array is not necessarily sorted.')
  } else if (kind === 'trie') {
    if (words.length > 8 || words.some((w) => !/^[a-z]{1,8}$/.test(w))) throw new Error('Use up to 8 lowercase words, each 1–8 letters.')
    const nodes: TreeNode[] = [{ id: 'root', label: '∅', children: [], detail: 'empty prefix' }]
    const add = (word: string) => {
      let parent = 'root',
        prefix = ''
      for (const ch of word) {
        prefix += ch
        if (!nodes.some((n) => n.id === prefix)) {
          nodes.find((n) => n.id === parent)!.children.push(prefix)
          nodes.push({ id: prefix, label: ch, children: [], detail: prefix })
        }
        parent = prefix
        emit(nodes, `Follow '${ch}': prefix '${prefix}'.`, [prefix])
      }
      nodes.find((n) => n.id === word)!.label += '•'
      emit(nodes, `Mark '${word}' as a complete word.`, [word])
    }
    if (action.type === 'insert') {
      const word = action.text?.trim().toLowerCase() ?? ''
      if (!/^[a-z]{1,8}$/.test(word)) throw new Error('Enter a lowercase word of 1–8 letters.')
      words = [...new Set([...words, word])]
      if (words.length > 8) throw new Error('Use at most 8 distinct words.')
    }
    if (action.type === 'delete') words = words.filter((w) => w !== action.text?.trim().toLowerCase())
    ;[...new Set(words)].forEach(add)
    if (action.type === 'search') {
      const prefix = action.text?.trim().toLowerCase() ?? ''
      const matches = words.filter((w) => w.startsWith(prefix))
      output.push(...matches)
      emit(
        nodes,
        matches.length ? `Prefix '${prefix}' matches ${matches.join(', ')}.` : `No words start with '${prefix}'.`,
        nodes.some((n) => n.id === prefix) ? [prefix] : [],
      )
    }
  } else if (kind === 'segment' || kind === 'fenwick') {
    if (!values.length) throw new Error('Enter at least one array value.')
    const index = action.index ?? 0,
      end = action.end ?? values.length - 1
    if (['query', 'update'].includes(action.type) && (!Number.isInteger(index) || index < 0 || index >= values.length))
      throw new Error('Choose a valid zero-based array index.')
    if (action.type === 'update') values[index] = value
    if (kind === 'segment') {
      const nodes: TreeNode[] = []
      const build = (l: number, r: number): string => {
        const id = `${l}:${r}`,
          mid = Math.floor((l + r) / 2),
          children = l === r ? [] : [build(l, mid), build(mid + 1, r)]
        nodes.unshift({ id, label: String(values.slice(l, r + 1).reduce((a, b) => a + b, 0)), children, detail: `[${l},${r}]` })
        return id
      }
      build(0, values.length - 1)
      emit(nodes, 'Each node stores the sum of its inclusive interval.')
      if (action.type === 'query') {
        if (!Number.isInteger(end) || end < index || end >= values.length) throw new Error('Range end must be an integer between start and the last index.')
        let sum = 0
        const query = (l: number, r: number) => {
          if (r < index || l > end) {
            emit(nodes, `[${l},${r}] has no overlap: contribute 0.`, [`${l}:${r}`])
            return
          }
          if (index <= l && r <= end) {
            const s = values.slice(l, r + 1).reduce((a, b) => a + b, 0)
            sum += s
            output.push(String(s))
            emit(nodes, `[${l},${r}] is fully covered: add ${s}.`, [`${l}:${r}`])
            return
          }
          const m = Math.floor((l + r) / 2)
          emit(nodes, `[${l},${r}] partially overlaps: split.`, [`${l}:${r}`])
          query(l, m)
          query(m + 1, r)
        }
        query(0, values.length - 1)
        emit(nodes, `Sum of [${index},${end}] = ${sum}.`)
      }
      if (action.type === 'update')
        emit(
          nodes,
          `Set array[${index}] = ${value}; every ancestor interval sum has been recomputed.`,
          nodes
            .filter((n) => {
              const [l, r] = n.id.split(':').map(Number)
              return l <= index && index <= r
            })
            .map((n) => n.id),
        )
    } else {
      const bit = Array(values.length + 1).fill(0) as number[]
      values.forEach((v, i) => {
        for (let j = i + 1; j < bit.length; j += j & -j) bit[j] += v
      })
      const nodes = values.map((_, i): TreeNode => {
        const k = i + 1
        return {
          id: String(k),
          label: String(bit[k]),
          detail: `BIT[${k}] · [${k - (k & -k)},${k - 1}]`,
          children: values
            .map((_, j) => j + 1)
            .filter((j) => j + (j & -j) === k)
            .map(String),
        }
      })
      emit(nodes, 'A Fenwick node stores a lowbit-sized interval; array indices are zero-based, BIT indices are one-based.')
      if (action.type === 'query') {
        let sum = 0
        for (let i = index + 1; i > 0; i -= i & -i) {
          sum += bit[i]
          output.push(String(bit[i]))
          emit(nodes, `Add BIT[${i}] = ${bit[i]}, then jump to ${i - (i & -i)}. Running sum ${sum}.`, [String(i)])
        }
        emit(nodes, `Prefix sum through array[${index}] = ${sum}.`)
      }
      if (action.type === 'update') {
        const active: string[] = []
        for (let i = index + 1; i < bit.length; i += i & -i) {
          active.push(String(i))
          emit(nodes, `Update BIT[${i}], then jump to ${i + (i & -i)}.`, [String(i)])
        }
        emit(nodes, `Point assignment complete: array[${index}] = ${value}.`, active)
      }
    }
  } else if (kind === 'btree') {
    type BNode = { id: string; keys: number[]; children: BNode[] }
    let serial = 0,
      root: BNode = { id: String(serial++), keys: [], children: [] }
    const snapshot = (): TreeNode[] => {
      const walk = (n: BNode): TreeNode[] => [
        { id: n.id, label: n.keys.join(' | ') || '∅', children: n.children.map((c) => c.id), detail: `${n.keys.length} / 3 keys` },
        ...n.children.flatMap(walk),
      ]
      return walk(root)
    }
    const split = (p: BNode, i: number) => {
      const c = p.children[i],
        right: BNode = { id: String(serial++), keys: c.keys.splice(2), children: c.children.splice(2) }
      const median = c.keys.pop()!
      p.keys.splice(i, 0, median)
      p.children.splice(i + 1, 0, right)
      emit(snapshot(), `Split full node; promote median ${median}.`, [p.id, c.id, right.id])
    }
    const insert = (n: BNode, key: number) => {
      if (!n.children.length) {
        n.keys.push(key)
        n.keys.sort((a, b) => a - b)
        emit(snapshot(), `Insert ${key} into a leaf.`, [n.id])
        return
      }
      let i = n.keys.findIndex((v) => key < v)
      if (i < 0) i = n.keys.length
      if (n.children[i].keys.length === 3) {
        split(n, i)
        if (key > n.keys[i]) i++
      }
      insert(n.children[i], key)
    }
    if (action.type === 'insert') values.push(value)
    values = [...new Set(values)]
    if (values.length > 15) throw new Error('Use at most 15 distinct keys.')
    for (const key of values) {
      if (root.keys.length === 3) {
        root = { id: String(serial++), keys: [], children: [root] }
        split(root, 0)
      }
      insert(root, key)
    }
    if (action.type === 'search') {
      let node: BNode | undefined = root
      while (node) {
        emit(snapshot(), `Search node [${node.keys.join(', ')}] for ${value}.`, [node.id])
        if (node.keys.includes(value)) {
          output.push(String(value))
          break
        }
        let i = node.keys.findIndex((k) => value < k)
        if (i < 0) i = node.keys.length
        node = node.children[i]
      }
      emit(snapshot(), output.length ? `Found ${value}.` : `${value} is absent.`)
    }
    emit(snapshot(), 'B-tree of minimum degree 2: at most 3 keys per node; all leaves have the same depth.')
  } else if (kind === 'expression') {
    const tokens = expression.match(/\d+(?:\.\d+)?|[()+*/-]/g) ?? []
    if (tokens.join('') !== expression.replace(/\s/g, '') || !tokens.length || tokens.length > 31)
      throw new Error('Use a short expression with positive numbers, parentheses and binary + − * / operators.')
    const postfix: string[] = [],
      operators: string[] = [],
      precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
    let expectOperand = true
    for (const token of tokens) {
      if (/^\d/.test(token)) {
        if (!expectOperand) throw new Error('Separate operands with an operator.')
        postfix.push(token)
        expectOperand = false
      } else if (token === '(') {
        if (!expectOperand) throw new Error('Add an operator before parentheses.')
        operators.push(token)
      } else if (token === ')') {
        if (expectOperand) throw new Error('Missing operand before closing parenthesis.')
        while (operators.length && operators.at(-1) !== '(') postfix.push(operators.pop()!)
        if (operators.pop() !== '(') throw new Error('Unmatched closing parenthesis.')
      } else {
        if (expectOperand) throw new Error('Use binary operators between operands; unary signs are not supported.')
        while (operators.length && precedence[operators.at(-1)!] >= precedence[token]) postfix.push(operators.pop()!)
        operators.push(token)
        expectOperand = true
      }
    }
    if (expectOperand || operators.includes('(')) throw new Error('Complete the expression and close every parenthesis.')
    while (operators.length) postfix.push(operators.pop()!)
    const nodes: TreeNode[] = [],
      stack: string[] = []
    postfix.forEach((token, i) => {
      const children: string[] = []
      if (token in precedence) {
        const right = stack.pop(),
          left = stack.pop()
        if (!left || !right) throw new Error('Each operator needs two operands.')
        children.push(left, right)
      }
      const id = String(i)
      nodes.push({ id, label: token, children })
      stack.push(id)
    })
    emit(nodes, `Postfix: ${postfix.join(' ')}. Operators are internal nodes; numbers are leaves.`)
    const evaluate = (id: string): number => {
      const node = nodes.find((n) => n.id === id)!
      if (!node.children.length) return Number(node.label)
      const a = evaluate(node.children[0]),
        b = evaluate(node.children[1])
      if (node.label === '/' && b === 0) throw new Error('Division by zero is undefined.')
      const answer = node.label === '+' ? a + b : node.label === '-' ? a - b : node.label === '*' ? a * b : a / b
      output.push(`${a} ${node.label} ${b} = ${answer}`)
      emit(nodes, `Evaluate children before parent: ${output.at(-1)}.`, [id])
      return answer
    }
    const result = evaluate(stack[0])
    emit(nodes, `Expression value = ${result}.`)
  }
  if (!frames.length) emit([], 'The structure is empty. Insert an item to begin.')
  return { frames, values, words }
}

export function treeLayout(nodes: TreeNode[]) {
  const orderedBinary = nodes.every((n) => n.value !== undefined && n.id === String(n.value))
  const children = new Set(nodes.flatMap((n) => n.children)),
    roots = nodes.filter((n) => !children.has(n.id)),
    positions = new Map<string, { x: number; y: number }>()
  let slot = 0,
    maxDepth = 0
  const visit = (id: string, depth: number): number => {
    const n = nodes.find((n) => n.id === id)!
    maxDepth = Math.max(maxDepth, depth)
    if (orderedBinary) {
      const left = n.children.find((child) => nodes.find((c) => c.id === child)!.value! < n.value!)
      const right = n.children.find((child) => nodes.find((c) => c.id === child)!.value! > n.value!)
      if (left) visit(left, depth + 1)
      const x = slot++
      positions.set(id, { x, y: depth })
      if (right) visit(right, depth + 1)
      return x
    }
    const xs = n.children.map((child) => visit(child, depth + 1))
    const x = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : slot++
    positions.set(id, { x, y: depth })
    return x
  }
  roots.forEach((n) => {
    visit(n.id, 0)
    slot++
  })
  const width = Math.max(500, slot * 110 + 80)
  const occupied = Math.max(0, ...Array.from(positions.values(), (p) => p.x)) * 110 + 120
  const offset = Math.max(0, (width - occupied) / 2)
  for (const [id, p] of positions) positions.set(id, { x: 60 + offset + p.x * 110, y: 55 + p.y * 95 })
  return { positions, width, height: Math.max(300, maxDepth * 95 + 120) }
}
