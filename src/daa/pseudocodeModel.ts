export type PseudoValue = number | boolean
type Expr =
  | { kind: 'literal'; value: PseudoValue }
  | { kind: 'variable'; name: string }
  | { kind: 'array'; index: Expr }
  | { kind: 'floor'; value: Expr }
  | { kind: 'unary'; op: string; value: Expr }
  | { kind: 'binary'; op: string; left: Expr; right: Expr }
type Statement =
  | { kind: 'assign'; line: number; name: string; value: Expr }
  | { kind: 'return'; line: number; value: Expr }
  | { kind: 'for'; line: number; name: string; lo: Expr; hi: Expr; body: Statement[] }
  | { kind: 'while'; line: number; test: Expr; body: Statement[] }
  | { kind: 'if'; line: number; branches: { line: number; test: Expr; body: Statement[] }[]; otherwise?: Statement[] }
export type PseudoProgram = { name: string; body: Statement[]; source: string }
export type PseudoFrame = {
  line: number
  phase: 'assignment' | 'condition' | 'loop' | 'return'
  variables: Record<string, PseudoValue>
  test?: boolean
  result?: PseudoValue
}
export type PseudoRun = { program: PseudoProgram; values: number[]; target: number; frames: PseudoFrame[]; result: PseudoValue }
export type PseudoTemplate = 'linear' | 'binary' | 'maximum' | 'sum'
export const pseudoTemplates: Record<PseudoTemplate, string> = {
  linear: `ALGORITHM LinearSearch(A, n, x)
// Input: array A[0..n−1], value x
// Output: index of x, or −1 if not found
for i ← 0 to n − 1 do
  if A[i] = x then
    return i
end for
return −1`,
  binary: `ALGORITHM BinarySearch(A, n, x)
// Input: sorted array A[0..n−1], value x
// Output: index of x, or −1 if not found
low ← 0
high ← n − 1
while low ≤ high do
  mid ← floor((low + high) / 2)
  if A[mid] = x then
    return mid
  else if A[mid] < x then
    low ← mid + 1
  else
    high ← mid − 1
return −1`,
  maximum: `ALGORITHM FindMaximum(A, n, x)
// Input: nonempty array A[0..n−1]
// Output: greatest array value
best ← A[0]
for i ← 1 to n − 1 do
  if A[i] > best then
    best ← A[i]
end for
return best`,
  sum: `ALGORITHM ArraySum(A, n, x)
// Input: array A[0..n−1]
// Output: sum of all array values
total ← 0
for i ← 0 to n − 1 do
  total ← total + A[i]
end for
return total`,
}
const normalize = (s: string) =>
  s.replaceAll('−', '-').replaceAll('≤', '<=').replaceAll('≥', '>=').replaceAll('≠', '!=').replaceAll('×', '*').replaceAll('÷', '/')
function fail(line: number, message: string): never {
  throw new Error(`Line ${line}: ${message}`)
}
const precedence: Record<string, number> = { or: 1, and: 2, '=': 3, '==': 3, '!=': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '+': 4, '-': 4, '*': 5, '/': 5, '%': 5 }
function expression(text: string, line: number): Expr {
  const input = normalize(text),
    tokens: string[] = []
  const lexer = /\s*(\d+(?:\.\d*)?(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?|[A-Za-z_]\w*|<=|>=|!=|==|[+\-*/%=<>()[\]])/iy
  let at = 0
  while (at < input.length) {
    lexer.lastIndex = at
    const m = lexer.exec(input)
    if (!m) {
      if (!input.slice(at).trim()) break
      fail(line, 'Unsupported expression syntax.')
    }
    tokens.push(m[1])
    at = lexer.lastIndex
    if (tokens.length > 256) fail(line, 'Expression is too complex.')
  }
  let pos = 0,
    depth = 0
  function primary(): Expr {
    if (++depth > 32) fail(line, 'Expression nesting is too deep.')
    const t = tokens[pos++]
    let value: Expr
    if (!t) fail(line, 'Expected a value.')
    if (t === '-' || t === '+' || t === 'not') value = { kind: 'unary', op: t, value: primary() }
    else if (t === '(') {
      value = parse(0)
      if (tokens[pos++] !== ')') fail(line, 'Missing closing parenthesis.')
    } else if (/^\d|^\.\d/.test(t)) {
      const n = Number(t)
      if (!Number.isFinite(n)) fail(line, 'Use finite numbers.')
      value = { kind: 'literal', value: n }
    } else if (t === 'true' || t === 'false') value = { kind: 'literal', value: t === 'true' }
    else if (t === 'floor') {
      if (tokens[pos++] !== '(') fail(line, 'Use floor(expression).')
      value = { kind: 'floor', value: parse(0) }
      if (tokens[pos++] !== ')') fail(line, 'Missing closing parenthesis.')
    } else if (t === 'A' && tokens[pos] === '[') {
      pos++
      value = { kind: 'array', index: parse(0) }
      if (tokens[pos++] !== ']') fail(line, 'Missing closing array bracket.')
    } else if (/^[A-Za-z_]\w*$/.test(t)) value = { kind: 'variable', name: t }
    else fail(line, 'Expected a number, variable or A[index].')
    depth--
    return value!
  }
  function parse(min: number): Expr {
    let left = primary()
    while (pos < tokens.length && (precedence[tokens[pos]] ?? -1) >= min) {
      const op = tokens[pos++],
        right = parse(precedence[op] + 1)
      left = { kind: 'binary', op, left, right }
    }
    return left
  }
  const result = parse(0)
  if (pos !== tokens.length) fail(line, 'Unexpected expression token.')
  return result
}
export function compilePseudocode(source: string): PseudoProgram {
  if (source.length > 12000 || source.split('\n').length > 120) throw new Error('Use at most 120 lines and 12000 characters of pseudocode.')
  const lines = source
    .split(/\r?\n/)
    .map((s, i) => {
      const text = s.replace(/\t/g, '  ').split('//')[0].trimEnd()
      return { text: text.trimStart(), indent: text.length - text.trimStart().length, line: i + 1 }
    })
    .filter((l) => l.text)
  const header = lines.shift(),
    match = header?.text.match(/^ALGORITHM\s+([A-Za-z_]\w*)\s*\(\s*A\s*,\s*n\s*,\s*x\s*\)$/i)
  if (!match) throw new Error('Start with ALGORITHM Name(A, n, x).')
  let cursor = 0
  function block(indent: number, depth: number): Statement[] {
    if (depth > 16) throw new Error('Use at most 16 levels of indentation.')
    const body: Statement[] = []
    while (cursor < lines.length) {
      const l = lines[cursor]
      if (l.indent < indent || /^else\b|^end\s/i.test(l.text)) break
      if (l.indent !== indent) fail(l.line, 'Unexpected indentation.')
      cursor++
      const ret = l.text.match(/^return\s+(.+)$/i),
        assign = l.text.match(/^([A-Za-z_]\w*)\s*(?:←|<-)\s*(.+)$/),
        loop = l.text.match(/^for\s+([A-Za-z_]\w*)\s*(?:←|<-)\s*(.+)\s+to\s+(.+)\s+do$/i),
        whileLoop = l.text.match(/^while\s+(.+)\s+do$/i),
        cond = l.text.match(/^if\s+(.+)\s+then$/i)
      function child() {
        const next = lines[cursor]
        if (!next || next.indent <= l.indent) fail(l.line, 'Indent a nonempty body under this statement.')
        return block(next.indent, depth + 1)
      }
      function end(kind: string) {
        const next = lines[cursor]
        if (next?.indent === l.indent && next.text.toLowerCase() === `end ${kind}`) cursor++
      }
      if (ret) body.push({ kind: 'return', line: l.line, value: expression(ret[1], l.line) })
      else if (loop) {
        const nested = child()
        end('for')
        body.push({ kind: 'for', line: l.line, name: loop[1], lo: expression(loop[2], l.line), hi: expression(loop[3], l.line), body: nested })
      } else if (whileLoop) {
        const nested = child()
        end('while')
        body.push({ kind: 'while', line: l.line, test: expression(whileLoop[1], l.line), body: nested })
      } else if (cond) {
        const branches = [{ line: l.line, test: expression(cond[1], l.line), body: child() }]
        let otherwise: Statement[] | undefined
        while (lines[cursor]?.indent === l.indent && /^else\b/i.test(lines[cursor].text)) {
          const clause = lines[cursor++],
            elif = clause.text.match(/^else\s+if\s+(.+)\s+then$/i)
          if (elif) branches.push({ line: clause.line, test: expression(elif[1], clause.line), body: child() })
          else if (clause.text.toLowerCase() === 'else') {
            otherwise = child()
            break
          } else fail(clause.line, 'Use else or else if condition then.')
        }
        end('if')
        body.push({ kind: 'if', line: l.line, branches, otherwise })
      } else if (assign) {
        if (assign[1] === 'A') fail(l.line, 'The input array A is read-only.')
        body.push({ kind: 'assign', line: l.line, name: assign[1], value: expression(assign[2], l.line) })
      } else fail(l.line, 'Supported statements: assignment, if, for, while and return.')
    }
    return body
  }
  if (!lines.length) throw new Error('Add statements and a return value below the algorithm header.')
  const body = block(lines[0].indent, 0)
  if (cursor !== lines.length) fail(lines[cursor].line, 'Unmatched end/else or inconsistent indentation.')
  return { name: match[1], body, source }
}
function numeric(value: PseudoValue, line: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(line, 'Expected a finite numeric value.')
  return value as number
}
function logical(value: PseudoValue, line: number) {
  if (typeof value !== 'boolean') fail(line, 'A condition must compare values or use a boolean expression.')
  return value as boolean
}
export function validatePseudoInput(values: unknown, target: unknown): asserts values is number[] {
  if (!Array.isArray(values) || values.length > 30 || values.some((v) => typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e6))
    throw new Error('Use an array of 0–30 finite numbers between −1000000 and 1000000.')
  if (typeof target !== 'number' || !Number.isFinite(target) || Math.abs(target) > 1e6) throw new Error('Use a finite target x between −1000000 and 1000000.')
}
export function parsePseudoArray(text: string): number[] {
  let values: unknown
  try {
    const s = text.trim()
    values = !s
      ? []
      : s.startsWith('[')
        ? JSON.parse(s)
        : s
            .split(/[\s,]+/)
            .filter(Boolean)
            .map(Number)
  } catch {
    throw new Error('Enter a number list or a valid JSON array.')
  }
  validatePseudoInput(values, 0)
  return values
}
export function runPseudocode(source: string, values: number[], target: number, maxSteps = 1000): PseudoRun {
  validatePseudoInput(values, target)
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1 || maxSteps > 5000) throw new Error('Step limit must be between 1 and 5000.')
  const program = compilePseudocode(source),
    a = [...values],
    env: Record<string, PseudoValue> = Object.assign(Object.create(null), { n: a.length, x: target }),
    frames: PseudoFrame[] = []
  if (program.name.toLowerCase() === 'binarysearch' && a.some((v, i) => i > 0 && v < a[i - 1]))
    throw new Error('BinarySearch requires a sorted array in nondecreasing order.')
  function evaluate(e: Expr, line: number): PseudoValue {
    if (e.kind === 'literal') return e.value
    if (e.kind === 'variable') {
      if (!Object.hasOwn(env, e.name)) fail(line, `Variable ${e.name} is not defined.`)
      return env[e.name]
    }
    if (e.kind === 'array') {
      const i = numeric(evaluate(e.index, line), line)
      if (!Number.isSafeInteger(i) || i < 0 || i >= a.length) fail(line, `Array index ${i} is outside 0…${a.length - 1}.`)
      return a[i]
    }
    if (e.kind === 'floor') return Math.floor(numeric(evaluate(e.value, line), line))
    if (e.kind === 'unary') {
      const v = evaluate(e.value, line)
      return e.op === 'not' ? !logical(v, line) : e.op === '-' ? -numeric(v, line) : numeric(v, line)
    }
    const left = evaluate(e.left, line)
    if (e.op === 'and') return logical(left, line) && logical(evaluate(e.right, line), line)
    if (e.op === 'or') return logical(left, line) || logical(evaluate(e.right, line), line)
    const right = evaluate(e.right, line)
    if (e.op === '=' || e.op === '==') return left === right
    if (e.op === '!=') return left !== right
    const x = numeric(left, line),
      y = numeric(right, line)
    if (e.op === '<') return x < y
    if (e.op === '>') return x > y
    if (e.op === '<=') return x <= y
    if (e.op === '>=') return x >= y
    if ((e.op === '/' || e.op === '%') && y === 0) fail(line, 'Division by zero is undefined.')
    const result = e.op === '+' ? x + y : e.op === '-' ? x - y : e.op === '*' ? x * y : e.op === '/' ? x / y : x % y
    if (!Number.isFinite(result)) fail(line, 'Arithmetic produced a nonfinite result.')
    return result
  }
  function emit(line: number, phase: PseudoFrame['phase'], extra: Partial<PseudoFrame> = {}) {
    if (frames.length >= maxSteps) fail(line, `Execution stopped at the ${maxSteps}-step limit. Check termination and loop updates.`)
    frames.push({ line, phase, variables: { ...env }, ...extra })
  }
  type Returned = { value: PseudoValue }
  function execute(body: Statement[]): Returned | undefined {
    for (const s of body) {
      if (s.kind === 'assign') {
        env[s.name] = evaluate(s.value, s.line)
        emit(s.line, 'assignment')
      } else if (s.kind === 'return') {
        const value = evaluate(s.value, s.line)
        emit(s.line, 'return', { result: value })
        return { value }
      } else if (s.kind === 'if') {
        let chosen: Statement[] | undefined
        for (const b of s.branches) {
          const test = logical(evaluate(b.test, b.line), b.line)
          emit(b.line, 'condition', { test })
          if (test) {
            chosen = b.body
            break
          }
        }
        const r = execute(chosen ?? s.otherwise ?? [])
        if (r) return r
      } else if (s.kind === 'while') {
        while (true) {
          const test = logical(evaluate(s.test, s.line), s.line)
          emit(s.line, 'loop', { test })
          if (!test) break
          const r = execute(s.body)
          if (r) return r
        }
      } else {
        const lo = numeric(evaluate(s.lo, s.line), s.line),
          hi = numeric(evaluate(s.hi, s.line), s.line)
        if (!Number.isSafeInteger(lo) || !Number.isSafeInteger(hi)) fail(s.line, 'For-loop bounds must be integers.')
        let i = lo
        for (; i <= hi; i++) {
          env[s.name] = i
          emit(s.line, 'loop', { test: true })
          const r = execute(s.body)
          if (r) return r
        }
        env[s.name] = i
        emit(s.line, 'loop', { test: false })
      }
    }
    return undefined
  }
  const returned = execute(program.body)
  if (!returned) throw new Error('The program ended without returning an output.')
  return { program, values: a, target, frames, result: returned.value }
}
export function descriptionTemplate(text: string): PseudoTemplate {
  const s = text.toLowerCase()
  if (s.length > 2000) throw new Error('Keep the description under 2000 characters.')
  if (/maximum|largest|greatest/.test(s)) return 'maximum'
  if (/sum|total/.test(s)) return 'sum'
  if (/binary|sorted/.test(s) && /search|find|look/.test(s)) return 'binary'
  if (/search|find|look/.test(s) && /array|value|element/.test(s)) return 'linear'
  throw new Error('This converter supports templates for linear search, binary search, maximum and sum. Edit other algorithms manually.')
}
export function binarySearchExample(values: number[], target: number) {
  validatePseudoInput(values, target)
  if (values.some((v, i) => i > 0 && v < values[i - 1])) throw new Error('Binary search needs a sorted array.')
  const rows: { low: number; high: number; mid: number; value: number; action: string }[] = []
  let low = 0,
    high = values.length - 1,
    result = -1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2),
      value = values[mid]
    let action: string
    if (value === target) {
      result = mid
      action = `x found → return ${mid}`
    } else if (value < target) action = `x > ${value} → low = ${mid + 1}`
    else action = `x < ${value} → high = ${mid - 1}`
    rows.push({ low, high, mid, value, action })
    if (result !== -1) break
    if (value < target) low = mid + 1
    else high = mid - 1
  }
  return { rows, result }
}
