import { StateView } from './DaaWorkspace'
import type { DaaInput, LearningState, Lesson } from './types'

type ResultRecord = Record<string, unknown>
type Props = { lesson: Lesson; input: DaaInput; state?: LearningState; result?: unknown; step: number }

function PseudocodeStudio({ step }: { step: number }) {
  const code = ['ALGORITHM LinearSearch(A, n, x)', '// Input: array A and target x', 'for i ← 0 to n − 1 do', '  if A[i] = x then', '    return i', 'return −1']
  return (
    <div className="tuv-code-studio">
      <section>
        <h4>
          Pseudocode editor <span>Linear Search</span>
        </h4>
        <ol>
          {code.map((line, i) => (
            <li className={i === Math.min(code.length - 1, step + 1) ? 'active' : ''} key={line}>
              <code>{line}</code>
            </li>
          ))}
        </ol>
      </section>
      <section className="tuv-flowchart">
        <h4>Flowchart visualizer</h4>
        {['Start', 'i = 0', 'i < n?', 'A[i] = x?', 'return i / −1'].map((label, i) => (
          <div className={i <= step ? 'active' : ''} key={label}>
            {label}
            {i < 4 && <span>↓</span>}
          </div>
        ))}
      </section>
      <section>
        <h4>Natural language → pseudocode</h4>
        <p>Search for a value in an array. Return its index if found; otherwise return −1.</p>
        <pre>{`for i ← 0 to n − 1\n  if A[i] = x\n    return i\nreturn −1`}</pre>
      </section>
    </div>
  )
}

function PartitionStudio({ lesson, input, state, result }: Props) {
  const values = state?.values?.filter((v): v is number => typeof v === 'number') ?? input.values ?? [],
    active = state?.activeIndices ?? []
  const pivot = values[active[0] ?? Math.floor(values.length / 2)] ?? 0,
    lower = values.filter((v) => v < pivot),
    equal = values.filter((v) => v === pivot),
    upper = values.filter((v) => v > pivot),
    selected = (result as ResultRecord | undefined)?.value
  return (
    <div className="tuv-partition">
      <div className="tuv-partition-source">
        <small>Current subarray</small>
        {values.map((v, i) => (
          <span className={active.includes(i) ? 'pivot' : ''} key={i}>
            <b>{v}</b>
            <small>{i}</small>
          </span>
        ))}
      </div>
      <div className="tuv-pivot-label">Pivot {pivot}</div>
      <div className="tuv-partition-groups">
        <section>
          <h4>Less than pivot</h4>
          {lower.map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </section>
        <section className="equal">
          <h4>Equal to pivot</h4>
          {equal.map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </section>
        <section className="greater">
          <h4>Greater than pivot</h4>
          {upper.map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </section>
      </div>
      {selected !== undefined && (
        <p className="tuv-selection-result">
          Order statistic selected: <b>{String(selected)}</b>
        </p>
      )}
      <small>
        {lesson.id === 'randomized-quicksort'
          ? 'A seeded pivot makes the experiment reproducible; it does not change correctness.'
          : 'Compare k with the partition sizes, then recurse into only one side.'}
      </small>
    </div>
  )
}

function ClosestPairStudio({ input, result, state }: Props) {
  const points = input.points ?? [],
    r = (result ?? {}) as ResultRecord,
    pair = (r.pair ?? []) as number[][],
    maxX = Math.max(1, ...points.map(([x]) => x)),
    maxY = Math.max(1, ...points.map(([, y]) => y)),
    scaleX = (v: number) => 40 + (v / maxX) * 520,
    scaleY = (v: number) => 260 - (v / maxY) * 220
  return (
    <div className="tuv-points">
      <svg viewBox="0 0 620 300" role="img" aria-label="Closest pair plane and midpoint strip">
        <line x1="310" x2="310" y1="15" y2="280" className="midline" />
        <rect x="250" y="15" width="120" height="265" />
        <text x="310" y="294">
          midpoint strip
        </text>
        {points.map(([x, y], i) => {
          const chosen = pair.some(([px, py]) => px === x && py === y)
          return (
            <g className={chosen ? 'chosen' : ''} key={i}>
              <circle cx={scaleX(x)} cy={scaleY(y)} r="10" />
              <text x={scaleX(x) + 15} y={scaleY(y) + 5}>
                ({x}, {y})
              </text>
            </g>
          )
        })}
        {pair.length === 2 && <line className="closest" x1={scaleX(pair[0][0])} y1={scaleY(pair[0][1])} x2={scaleX(pair[1][0])} y2={scaleY(pair[1][1])} />}
      </svg>
      <section>
        <h4>Divide-and-conquer state</h4>
        <p>Sort by x, solve both halves, then inspect only strip points whose x-distance is below δ.</p>
        <b>δ = {Number(r.distance ?? 0).toFixed(3)}</b>
        <small>{state?.table ? `Current candidate rows: ${state.table.length}` : 'Only a constant number of following y-neighbors need inspection.'}</small>
      </section>
    </div>
  )
}

function GraphAnalysisStudio({ lesson, input, state, result }: Props) {
  const graph = state?.graph,
    r = (result ?? {}) as ResultRecord
  if (lesson.id === 'bipartite-matching') {
    const edges = input.edges ?? [],
      selected = graph?.selected ?? [],
      split = Math.floor((input.vertices ?? 4) / 2),
      left = Array.from({ length: split }, (_, i) => i),
      right = Array.from({ length: Math.max(0, (input.vertices ?? 4) - split) }, (_, i) => i + split),
      yPosition = (index: number, count: number) => 50 + (index * 200) / Math.max(1, count - 1)
    return (
      <div className="tuv-bipartite">
        <svg viewBox="0 0 680 300" role="img" aria-label="Bipartite matching graph">
          {edges.map((e, i) => {
            const match = selected.some(([u, v]) => (u === e.from && v === e.to) || (u === e.to && v === e.from))
            return (
              <line
                className={match ? 'matched' : ''}
                key={i}
                x1="170"
                y1={yPosition(left.indexOf(e.from), left.length)}
                x2="510"
                y2={yPosition(right.indexOf(e.to), right.length)}
              />
            )
          })}
          {left.map((v, i) => (
            <g key={v}>
              <circle cx="170" cy={yPosition(i, left.length)} r="27" />
              <text x="170" y={yPosition(i, left.length) + 6}>
                {v}
              </text>
            </g>
          ))}
          {right.map((v, i) => (
            <g key={v}>
              <circle cx="510" cy={yPosition(i, right.length)} r="27" />
              <text x="510" y={yPosition(i, right.length) + 6}>
                {v}
              </text>
            </g>
          ))}
        </svg>
        <section>
          <h4>Matching state</h4>
          <p>Blue edges are matched. An augmenting path alternates unmatched and matched edges, then flips them.</p>
          <b>|M| = {((r.matching ?? []) as unknown[]).length}</b>
        </section>
      </div>
    )
  }
  return (
    <div className="tuv-graph-analysis">
      <div>
        <StateView state={state} />
      </div>
      <section>
        <h4>{lesson.id === 'bridges' ? 'Bridge criterion' : 'Articulation criterion'}</h4>
        <p>
          {lesson.id === 'bridges'
            ? 'Tree edge (u,v) is a bridge exactly when low[v] > disc[u].'
            : 'A non-root u is a cut vertex when some child v has low[v] ≥ disc[u]. A DFS root needs at least two children.'}
        </p>
        <div className="tuv-label-grid">
          {graph?.labels?.map((label, i) => (
            <span key={i}>
              <b>v{i}</b>
              {label || '—'}
            </span>
          ))}
        </div>
        <strong>Result: {JSON.stringify(lesson.id === 'bridges' ? r.bridges : r.articulation)}</strong>
      </section>
    </div>
  )
}

function EulerStudio({ input, state, result }: Props) {
  const degrees = Array.from({ length: input.vertices ?? 0 }, (_, v) => (input.edges ?? []).filter((e) => e.from === v || e.to === v).length),
    trail = state?.values ?? ((result as ResultRecord | undefined)?.trail as unknown[]) ?? []
  return (
    <div className="tuv-euler">
      <section>
        <h4>Degree condition</h4>
        {degrees.map((degree, i) => (
          <span className={degree % 2 ? 'odd' : ''} key={i}>
            <b>v{i}</b>degree {degree}
          </span>
        ))}
      </section>
      <section>
        <h4>Edge-consumption stack</h4>
        <div>
          {trail.map((v, i) => (
            <span key={i}>
              {String(v)}
              {i < trail.length - 1 && <i>→</i>}
            </span>
          ))}
        </div>
        <p>
          {degrees.filter((d) => d % 2).length === 0
            ? 'All degrees are even: an Eulerian circuit may exist.'
            : 'Exactly two odd vertices are required for an open Eulerian trail.'}
        </p>
      </section>
    </div>
  )
}

function StringStudio({ lesson, input, state, result, step }: Props) {
  if (lesson.id === 'suffix-array')
    return (
      <div className="tuv-suffix">
        <section>
          <h4>Suffixes of “{input.text}”</h4>
          {Array.from(input.text ?? '').map((_, i) => (
            <span key={i}>
              <b>{i}</b>
              {input.text?.slice(i)}
            </span>
          ))}
        </section>
        <section>
          <h4>Lexicographic order</h4>
          <StateView state={state} />
        </section>
      </div>
    )
  const text = input.text ?? '',
    pattern = input.pattern ?? '',
    offset = Math.min(Math.max(0, text.length - pattern.length), step),
    last = Object.fromEntries(Array.from(pattern).map((ch, i) => [ch, i]))
  return (
    <div className="tuv-boyer">
      <div className="tuv-character-row">
        {Array.from(text).map((ch, i) => (
          <span key={i}>
            <small>{i}</small>
            {ch}
          </span>
        ))}
      </div>
      <div className="tuv-character-row pattern" style={{ paddingLeft: `${offset * 46}px` }}>
        {Array.from(pattern).map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </div>
      <div className="tuv-bad-table">
        <b>Rightmost occurrence</b>
        {Object.entries(last).map(([ch, i]) => (
          <span key={ch}>
            {ch} → {i}
          </span>
        ))}
      </div>
      <p>Matches: {JSON.stringify((result as ResultRecord | undefined)?.matches ?? [])}. Shift safely using the rightmost compatible occurrence.</p>
    </div>
  )
}

function KaratsubaStudio({ input, state, result }: Props) {
  const x = input.x ?? '0',
    y = input.y ?? '0',
    m = Math.ceil(Math.max(x.length, y.length) / 2),
    highX = x.slice(0, -m) || '0',
    lowX = x.slice(-m),
    highY = y.slice(0, -m) || '0',
    lowY = y.slice(-m)
  return (
    <div className="tuv-karatsuba">
      <div>
        <span>
          x = <b>{highX}</b>·10ᵐ + <b>{lowX}</b>
        </span>
        <span>
          y = <b>{highY}</b>·10ᵐ + <b>{lowY}</b>
        </span>
      </div>
      <section>
        {(state?.values ?? []).map((v, i) => (
          <span key={i}>
            <small>{['z₂ = ac', 'z₀ = bd', 'z₁ = (a+b)(c+d)−z₂−z₀'][i] ?? `product ${i + 1}`}</small>
            <b>{String(v)}</b>
          </span>
        ))}
      </section>
      <p>
        xy = z₂·10²ᵐ + z₁·10ᵐ + z₀ = <b>{String((result as ResultRecord | undefined)?.product ?? '—')}</b>
      </p>
    </div>
  )
}

export function ConceptStudio({ lesson, step }: { lesson: Lesson; step: number }) {
  const process = lesson.pseudocode.length ? lesson.pseudocode : ['State the problem', 'Choose a model', 'Advance the state', 'Prove the invariant', 'Conclude']
  return (
    <div className="tuv-concept">
      <section>
        <h4>Core idea</h4>
        <p>{lesson.summary}</p>
        <blockquote>{lesson.example}</blockquote>
      </section>
      <div className="tuv-concept-flow">
        {process.slice(0, 5).map((line, i) => (
          <div className={i === Math.min(step, 4) ? 'active' : ''} key={i}>
            <span>{i + 1}</span>
            <p>{line}</p>
          </div>
        ))}
      </div>
      <section>
        <h4>Why it works</h4>
        <p>{lesson.correctness}</p>
        <b>
          {lesson.time} time · {lesson.space} space
        </b>
      </section>
    </div>
  )
}

export function RichLessonScene(props: Props) {
  const { lesson } = props
  if (lesson.id === 'algorithm-foundations') return <PseudocodeStudio step={props.step} />
  if (['quickselect', 'deterministic-selection', 'randomized-quicksort', 'randomized-selection'].includes(lesson.id)) return <PartitionStudio {...props} />
  if (lesson.id === 'closest-pair') return <ClosestPairStudio {...props} />
  if (['bipartite-matching', 'bridges', 'articulation-points'].includes(lesson.id)) return <GraphAnalysisStudio {...props} />
  if (lesson.id === 'eulerian-trail') return <EulerStudio {...props} />
  if (['boyer-moore', 'suffix-array'].includes(lesson.id)) return <StringStudio {...props} />
  if (lesson.id === 'karatsuba') return <KaratsubaStudio {...props} />
  return null
}
