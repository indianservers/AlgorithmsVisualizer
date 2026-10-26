export type CookMode = 'letters' | 'binary'
export type CookState = 'q0' | 'q1' | 'q2' | 'qa' | 'qr'
export type CookBranch = 'scan' | 'reject'
export type CookGroup = 'cell' | 'initial' | 'transition' | 'accept'
export const cookGroups: CookGroup[] = ['cell', 'initial', 'transition', 'accept']
export const cookStates: CookState[] = ['q0', 'q1', 'q2', 'qa', 'qr']
export const cookStateLabel = (state: CookState) => ({ q0: 'q₀', q1: 'q₁', q2: 'q₂', qa: 'qₐ', qr: 'qᵣ' })[state]
export const cookSymbolLabel = (symbol: string) => (symbol === '_' ? '⊔' : symbol)
export type CookRule = { id: number; from: CookState; read: string; to: CookState; write: string; move: -1 | 0 | 1; branch?: CookBranch }
export type CookRow = { t: number; tape: string[]; head: number; state: CookState; rule: number | null }
export type CookVariable = {
  id: number
  kind: 'symbol' | 'head' | 'state' | 'rule'
  t: number
  i?: number
  symbol?: string
  state?: CookState
  rule?: number
  name: string
}
export type CookClause = { literals: number[]; group: CookGroup; detail: string; t?: number; i?: number }
export function cookMachine(mode: CookMode) {
  const [zero, one] = mode === 'letters' ? ['a', 'b'] : ['0', '1'],
    symbols = ['_', zero, one],
    rules: CookRule[] = []
  const add = (from: CookState, read: string, to: CookState, write: string, move: -1 | 0 | 1, branch?: CookBranch) =>
    rules.push({ id: rules.length, from, read, to, write, move, branch })
  add('q0', '_', 'q1', zero, 1, 'scan')
  add('q0', '_', 'qr', '_', 0, 'reject')
  for (const state of ['q1', 'q2'] as CookState[]) {
    add(state, zero, 'q1', zero, 1)
    add(state, one, 'q2', one, 1)
    add(state, '_', state === 'q2' ? 'qa' : 'qr', '_', state === 'q2' ? -1 : 0)
  }
  for (const state of ['qa', 'qr'] as CookState[]) for (const symbol of symbols) add(state, symbol, state, symbol, 0)
  return { symbols, rules, zero, one, states: cookStates }
}
export function validateCookInput(word: string, time: number, mode: CookMode) {
  if (!Number.isInteger(time) || time < 0 || time > 8) throw new Error('Use an integer time bound T from 0 to 8.')
  if (word.length > 5 || !(mode === 'letters' ? /^[ab]*$/ : /^[01]*$/).test(word))
    throw new Error(
      mode === 'letters' ? 'Use up to 5 letters a or b; the empty input is allowed.' : 'Use up to 5 binary digits 0 or 1; the empty input is allowed.',
    )
}
export function simulateCookRun(word: string, time: number, mode: CookMode = 'letters', branch: CookBranch = 'scan'): CookRow[] {
  validateCookInput(word, time, mode)
  const machine = cookMachine(mode),
    tape = Array<string>(word.length + 4).fill('_')
  for (let j = 0; j < word.length; j++) tape[j + 3] = word[j]
  const rows: CookRow[] = [{ t: 0, tape, head: 2, state: 'q0', rule: null }]
  for (let t = 0; t < time; t++) {
    const row = rows[t],
      available = machine.rules.filter((rule) => rule.from === row.state && rule.read === row.tape[row.head]),
      rule = available.find((rule) => rule.branch === branch) ?? available[0]
    if (!rule) throw new Error('No machine transition is available for this configuration.')
    row.rule = rule.id
    const nextTape = [...row.tape]
    nextTape[row.head] = rule.write
    rows.push({ t: t + 1, tape: nextTape, head: row.head + rule.move, state: rule.to, rule: null })
  }
  return rows
}
export function buildCookEncoding(word = 'abb', time = 5, mode: CookMode = 'letters') {
  validateCookInput(word, time, mode)
  const machine = cookMachine(mode),
    space = word.length + 4,
    positions = Array.from({ length: space }, (_, i) => i - 2),
    variables: CookVariable[] = [],
    clauses: CookClause[] = [],
    lookup = new Map<string, number>()
  function variable(kind: CookVariable['kind'], t: number, token: string | number, i?: number) {
    const id = variables.length + 1,
      key = `${kind}:${t}:${i ?? ''}:${token}`
    const name =
      kind === 'symbol'
        ? `X[${t},${positions[i!]},${cookSymbolLabel(String(token))}]`
        : kind === 'head'
          ? `H[${t},${positions[i!]}]`
          : kind === 'state'
            ? `Q[${t},${token}]`
            : `D[${t},${token}]`
    variables.push({
      id,
      kind,
      t,
      i,
      name,
      ...(kind === 'symbol' ? { symbol: String(token) } : kind === 'state' ? { state: token as CookState } : kind === 'rule' ? { rule: Number(token) } : {}),
    })
    lookup.set(key, id)
  }
  const id = (kind: CookVariable['kind'], t: number, token: string | number, i?: number) => lookup.get(`${kind}:${t}:${i ?? ''}:${token}`)!
  for (let t = 0; t <= time; t++) {
    for (let i = 0; i < space; i++) for (const symbol of machine.symbols) variable('symbol', t, symbol, i)
    for (let i = 0; i < space; i++) variable('head', t, 'head', i)
    for (const state of machine.states) variable('state', t, state)
    if (t < time) for (const rule of machine.rules) variable('rule', t, rule.id)
  }
  const add = (literals: number[], group: CookGroup, detail: string, t?: number, i?: number) => clauses.push({ literals, group, detail, t, i })
  function exactlyOne(ids: number[], detail: string, t: number, i?: number) {
    add(ids, 'cell', `At least one ${detail}`, t, i)
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) add([-ids[a], -ids[b]], 'cell', `At most one ${detail}`, t, i)
  }
  for (let t = 0; t <= time; t++) {
    for (let i = 0; i < space; i++)
      exactlyOne(
        machine.symbols.map((symbol) => id('symbol', t, symbol, i)),
        `symbol at t=${t}, i=${positions[i]}`,
        t,
        i,
      )
    exactlyOne(
      positions.map((_, i) => id('head', t, 'head', i)),
      `head position at t=${t}`,
      t,
    )
    exactlyOne(
      machine.states.map((state) => id('state', t, state)),
      `machine state at t=${t}`,
      t,
    )
    if (t < time)
      exactlyOne(
        machine.rules.map((rule) => id('rule', t, rule.id)),
        `transition choice at t=${t}`,
        t,
      )
  }
  const initial = simulateCookRun(word, 0, mode)[0]
  initial.tape.forEach((symbol, i) => add([id('symbol', 0, symbol, i)], 'initial', `Initial tape cell ${positions[i]} is ${cookSymbolLabel(symbol)}`, 0, i))
  add([id('head', 0, 'head', 2)], 'initial', 'The initial head scans position 0', 0, 2)
  add([id('state', 0, 'q0')], 'initial', 'The initial state is q0', 0)
  for (let t = 0; t < time; t++) {
    for (const rule of machine.rules) {
      const choice = id('rule', t, rule.id)
      add([-choice, id('state', t, rule.from)], 'transition', `Rule ${rule.id} requires state ${rule.from}`, t)
      add([-choice, id('state', t + 1, rule.to)], 'transition', `Rule ${rule.id} sets state ${rule.to}`, t)
      for (let i = 0; i < space; i++) {
        const head = id('head', t, 'head', i)
        add([-choice, -head, id('symbol', t, rule.read, i)], 'transition', `Rule ${rule.id} reads ${cookSymbolLabel(rule.read)} at ${positions[i]}`, t, i)
        add(
          [-choice, -head, id('symbol', t + 1, rule.write, i)],
          'transition',
          `Rule ${rule.id} writes ${cookSymbolLabel(rule.write)} at ${positions[i]}`,
          t,
          i,
        )
        const next = i + rule.move
        add(
          next < 0 || next >= space ? [-choice, -head] : [-choice, -head, id('head', t + 1, 'head', next)],
          'transition',
          `Rule ${rule.id} moves the head ${rule.move}`,
          t,
          i,
        )
      }
    }
    for (let i = 0; i < space; i++)
      for (const symbol of machine.symbols)
        add(
          [id('head', t, 'head', i), -id('symbol', t, symbol, i), id('symbol', t + 1, symbol, i)],
          'transition',
          `A non-head cell at ${positions[i]} keeps ${cookSymbolLabel(symbol)}`,
          t,
          i,
        )
  }
  add([id('state', time, 'qa')], 'accept', 'The final padded configuration must be accepting', time)
  const scan = simulateCookRun(word, time, mode, 'scan'),
    reject = simulateCookRun(word, time, mode, 'reject'),
    accepting = scan.at(-1)!.state === 'qa' ? scan : null
  return {
    word,
    time,
    mode,
    machine,
    space,
    positions,
    variables,
    clauses,
    scan,
    reject,
    accepting,
    satisfiable: accepting !== null,
    branchCount: time === 0 ? 1 : 2,
  }
}
export type CookEncoding = ReturnType<typeof buildCookEncoding>
export function cookAssignment(encoding: CookEncoding, rows: CookRow[]) {
  const assignment = Array<boolean>(encoding.variables.length + 1).fill(false)
  for (const variable of encoding.variables) {
    const row = rows[variable.t]
    if (!row) continue
    assignment[variable.id] =
      variable.kind === 'symbol'
        ? row.tape[variable.i!] === variable.symbol
        : variable.kind === 'head'
          ? row.head === variable.i
          : variable.kind === 'state'
            ? row.state === variable.state
            : row.rule === variable.rule
  }
  return assignment
}
export function evaluateCookAssignment(encoding: CookEncoding, assignment: boolean[]) {
  const failed: number[] = [],
    groups = Object.fromEntries(cookGroups.map((group) => [group, { total: 0, failed: 0 }])) as Record<CookGroup, { total: number; failed: number }>
  encoding.clauses.forEach((clause, i) => {
    groups[clause.group].total++
    if (!clause.literals.some((lit) => (lit > 0 ? assignment[lit] === true : assignment[-lit] === false))) {
      failed.push(i)
      groups[clause.group].failed++
    }
  })
  return { valid: failed.length === 0, failed, groups, checked: encoding.clauses.length }
}
export const verifyCookTableau = (encoding: CookEncoding, rows: CookRow[]) => evaluateCookAssignment(encoding, cookAssignment(encoding, rows))
export function cookDimacs(encoding: CookEncoding) {
  return (
    [
      `c Cook-Levin teaching machine; input=${encoding.word || '(empty)'}, T=${encoding.time}`,
      `p cnf ${encoding.variables.length} ${encoding.clauses.length}`,
      ...encoding.clauses.map((clause) => `${clause.literals.join(' ')} 0`),
    ].join('\n') + '\n'
  )
}
export function formatCookClause(encoding: CookEncoding, clause: CookClause) {
  return clause.literals.map((lit) => `${lit < 0 ? '¬' : ''}${encoding.variables[Math.abs(lit) - 1].name}`).join(' ∨ ')
}
