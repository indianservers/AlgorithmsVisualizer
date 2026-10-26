import { describe, it, expect } from 'vitest'
import { buildCookEncoding, cookAssignment, cookDimacs, evaluateCookAssignment, simulateCookRun, verifyCookTableau } from './cookLevinModel'
describe('027 bounded nondeterministic computation and actual SAT clauses', () => {
  it('agrees with an independent DPLL solver on the generated CNF for small complete instances', () => {
    function solve(input: number[][]): boolean {
      let clauses = input
      while (true) {
        if (clauses.some((c) => c.length === 0)) return false
        if (clauses.length === 0) return true
        const unit = clauses.find((c) => c.length === 1)
        if (!unit) break
        const literal = unit[0]
        clauses = clauses.filter((c) => !c.includes(literal)).map((c) => c.filter((v) => v !== -literal))
      }
      const literal = clauses.reduce((a, b) => (a.length < b.length ? a : b))[0]
      return solve([...clauses, [literal]]) || solve([...clauses, [-literal]])
    }
    for (const word of ['', 'a', 'b', 'ab'])
      for (const time of [0, 2, 3, 4]) {
        const e = buildCookEncoding(word, time)
        expect(solve(e.clauses.map((c) => c.literals))).toBe(e.satisfiable)
      }
  }, 20000)
  it('constructs a six-row accepting reference branch with one head and real transitions', () => {
    const e = buildCookEncoding()
    expect(e.space).toBe(7)
    expect(e.scan).toHaveLength(6)
    expect(e.scan.map((r) => e.positions[r.head])).toEqual([0, 1, 2, 3, 4, 3])
    expect(e.scan.map((r) => r.state)).toEqual(['q0', 'q1', 'q1', 'q2', 'q2', 'qa'])
    expect(e.satisfiable).toBe(true)
    expect(verifyCookTableau(e, e.scan).valid).toBe(true)
    expect(e.variables.length).toBe(268)
    expect(verifyCookTableau(e, e.reject).groups.transition.failed).toBe(0)
    expect(verifyCookTableau(e, e.reject).groups.accept.failed).toBe(1)
  })
  it('checks initial, transition, accepting and well-formedness constraints independently', () => {
    const e = buildCookEncoding(),
      copy = () => structuredClone(e.scan)
    const initial = copy()
    initial[0].tape[3] = 'b'
    expect(verifyCookTableau(e, initial).groups.initial.failed).toBeGreaterThan(0)
    const illegal = copy()
    illegal[2].tape[0] = 'a'
    expect(verifyCookTableau(e, illegal).groups.transition.failed).toBeGreaterThan(0)
    const noHead = copy()
    noHead[2].head = -1
    expect(verifyCookTableau(e, noHead).groups.cell.failed).toBeGreaterThan(0)
    const noAccept = copy()
    noAccept[5].state = 'qr'
    expect(verifyCookTableau(e, noAccept).groups.accept.failed).toBe(1)
    const bits = cookAssignment(e, e.scan),
      symbol = e.variables.find((v) => v.kind === 'symbol' && v.t === 0 && v.i === 0 && v.symbol === 'a')!
    bits[symbol.id] = true
    expect(evaluateCookAssignment(e, bits).groups.cell.failed).toBeGreaterThan(0)
  })
  it('distinguishes a rejecting witness from UNSAT and an insufficient time bound from language rejection', () => {
    const yes = buildCookEncoding('abb', 5),
      short = buildCookEncoding('abb', 4),
      no = buildCookEncoding('aba', 5),
      empty = buildCookEncoding('', 5)
    expect(yes.satisfiable).toBe(true)
    expect(verifyCookTableau(yes, yes.reject).valid).toBe(false)
    expect(short.satisfiable).toBe(false)
    expect(short.scan.at(-1)!.state).toBe('q2')
    expect(no.satisfiable).toBe(false)
    expect(no.scan.at(-1)!.state).toBe('qr')
    expect(empty.satisfiable).toBe(false)
    expect(buildCookEncoding('101', 5, 'binary').satisfiable).toBe(true)
    expect(buildCookEncoding('110', 5, 'binary').satisfiable).toBe(false)
  })
  it('verifies generated legal branches against every clause across small inputs and time bounds', () => {
    for (const mode of ['letters', 'binary'] as const)
      for (let n = 0; n <= 3; n++)
        for (let mask = 0; mask < 2 ** n; mask++)
          for (const time of [0, 1, n + 1, n + 2, 8]) {
            const alphabet = mode === 'letters' ? 'ab' : '01',
              word = Array.from({ length: n }, (_, i) => alphabet[(mask >> i) & 1]).join(''),
              e = buildCookEncoding(word, time, mode)
            expect(e.satisfiable).toBe(n > 0 && word.endsWith(alphabet[1]) && time >= n + 2)
            for (const run of [e.scan, e.reject]) {
              const check = verifyCookTableau(e, run)
              expect(check.groups.cell.failed).toBe(0)
              expect(check.groups.initial.failed).toBe(0)
              expect(check.groups.transition.failed).toBe(0)
              expect(check.valid).toBe(run.at(-1)!.state === 'qa')
            }
          }
  })
  it('exports a real DIMACS instance and rejects unsupported teaching inputs', () => {
    const e = buildCookEncoding(),
      text = cookDimacs(e)
    expect(text).toContain(`p cnf 268 ${e.clauses.length}`)
    for (const clause of e.clauses) for (const lit of clause.literals) expect(Math.abs(lit)).toBeLessThanOrEqual(e.variables.length)
    for (const args of [
      ['x', 5, 'letters'],
      ['aaaaaa', 5, 'letters'],
      ['01', 5, 'letters'],
      ['a', 9, 'letters'],
      ['1', -1, 'binary'],
    ] as const)
      expect(() => buildCookEncoding(args[0], args[1], args[2])).toThrow()
    const padded = simulateCookRun('b', 8)
    expect(padded.at(-1)!.state).toBe('qa')
    expect(padded.slice(3).every((r) => r.head === 3)).toBe(true)
  })
})
