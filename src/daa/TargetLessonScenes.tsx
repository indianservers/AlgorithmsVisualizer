// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { StateView } from './DaaWorkspace'
import type { DaaInput, LearningState, Lesson } from './types'

type ResultRecord = Record<string, unknown>
type Props = { lesson: Lesson; input: DaaInput; state?: LearningState; result?: unknown; step: number }

function PseudocodeStudio({ step }: { step: number }) {
  useLocaleRender()

  const code = ['ALGORITHM LinearSearch(A, n, x)', '// Input: array A and target x', 'for i ← 0 to n − 1 do', '  if A[i] = x then', '    return i', 'return −1']
  return (
    <div className="tuv-code-studio">
      <section>
        <h4>
          {tx('Pseudocode editor ', 'studios')}
          <span>{tx('Linear Search', 'studios')}</span>
        </h4>
        <ol>
          {tx(
            code.map((line, i) => (
              <li className={i === Math.min(code.length - 1, step + 1) ? 'active' : ''} key={line}>
                <code>{line}</code>
              </li>
            )),
            'studios',
          )}
        </ol>
      </section>
      <section className="tuv-flowchart">
        <h4>{tx('Flowchart visualizer', 'studios')}</h4>
        {tx(
          ['Start', 'i = 0', 'i < n?', 'A[i] = x?', 'return i / −1'].map((label, i) => (
            <div className={i <= step ? 'active' : ''} key={label}>
              {tx(label, 'studios')}
              {tx(i < 4 && <span>↓</span>, 'studios')}
            </div>
          )),
          'studios',
        )}
      </section>
      <section>
        <h4>{tx('Natural language → pseudocode', 'studios')}</h4>
        <p>{tx('Search for a value in an array. Return its index if found; otherwise return −1.', 'studios')}</p>
        <pre>{`for i ← 0 to n − 1\n  if A[i] = x\n    return i\nreturn −1`}</pre>
      </section>
    </div>
  )
}

function PartitionStudio({ lesson, input, state, result }: Props) {
  useLocaleRender()

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
        <small>{tx('Current subarray', 'studios')}</small>
        {tx(
          values.map((v, i) => (
            <span className={active.includes(i) ? 'pivot' : ''} key={i}>
              <b>{tx(v, 'studios')}</b>
              <small>{tx(i, 'studios')}</small>
            </span>
          )),
          'studios',
        )}
      </div>
      <div className="tuv-pivot-label">
        {tx('Pivot ', 'studios')}
        {tx(pivot, 'studios')}
      </div>
      <div className="tuv-partition-groups">
        <section>
          <h4>{tx('Less than pivot', 'studios')}</h4>
          {tx(
            lower.map((v, i) => <span key={i}>{tx(v, 'studios')}</span>),
            'studios',
          )}
        </section>
        <section className="equal">
          <h4>{tx('Equal to pivot', 'studios')}</h4>
          {tx(
            equal.map((v, i) => <span key={i}>{tx(v, 'studios')}</span>),
            'studios',
          )}
        </section>
        <section className="greater">
          <h4>{tx('Greater than pivot', 'studios')}</h4>
          {tx(
            upper.map((v, i) => <span key={i}>{tx(v, 'studios')}</span>),
            'studios',
          )}
        </section>
      </div>
      {tx(
        selected !== undefined && (
          <p className="tuv-selection-result">
            {tx('Order statistic selected: ', 'studios')}
            <b>{tx(String(selected), 'studios')}</b>
          </p>
        ),
        'studios',
      )}
      <small>
        {tx(
          lesson.id === 'randomized-quicksort'
            ? 'A seeded pivot makes the experiment reproducible; it does not change correctness.'
            : 'Compare k with the partition sizes, then recurse into only one side.',
          'studios',
        )}
      </small>
    </div>
  )
}

function ClosestPairStudio({ input, result, state }: Props) {
  useLocaleRender()

  const points = input.points ?? [],
    r = (result ?? {}) as ResultRecord,
    pair = (r.pair ?? []) as number[][],
    maxX = Math.max(1, ...points.map(([x]) => x)),
    maxY = Math.max(1, ...points.map(([, y]) => y)),
    scaleX = (v: number) => 40 + (v / maxX) * 520,
    scaleY = (v: number) => 260 - (v / maxY) * 220
  return (
    <div className="tuv-points">
      <svg viewBox="0 0 620 300" role="img" aria-label={tx('Closest pair plane and midpoint strip', 'studios')}>
        <line x1="310" x2="310" y1="15" y2="280" className="midline" />
        <rect x="250" y="15" width="120" height="265" />
        <text x="310" y="294">
          {tx('midpoint strip', 'studios')}
        </text>
        {tx(
          points.map(([x, y], i) => {
            const chosen = pair.some(([px, py]) => px === x && py === y)
            return (
              <g className={chosen ? 'chosen' : ''} key={i}>
                <circle cx={scaleX(x)} cy={scaleY(y)} r="10" />
                <text x={scaleX(x) + 15} y={scaleY(y) + 5}>
                  ({x}, {y})
                </text>
              </g>
            )
          }),
          'studios',
        )}
        {tx(
          pair.length === 2 && <line className="closest" x1={scaleX(pair[0][0])} y1={scaleY(pair[0][1])} x2={scaleX(pair[1][0])} y2={scaleY(pair[1][1])} />,
          'studios',
        )}
      </svg>
      <section>
        <h4>{tx('Divide-and-conquer state', 'studios')}</h4>
        <p>{tx('Sort by x, solve both halves, then inspect only strip points whose x-distance is below δ.', 'studios')}</p>
        <b>δ = {tx(Number(r.distance ?? 0).toFixed(3), 'studios')}</b>
        <small>
          {tx(state?.table ? `Current candidate rows: ${state.table.length}` : 'Only a constant number of following y-neighbors need inspection.', 'studios')}
        </small>
      </section>
    </div>
  )
}

function GraphAnalysisStudio({ lesson, input, state, result }: Props) {
  useLocaleRender()

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
        <svg viewBox="0 0 680 300" role="img" aria-label={tx('Bipartite matching graph', 'studios')}>
          {tx(
            edges.map((e, i) => {
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
            }),
            'studios',
          )}
          {tx(
            left.map((v, i) => (
              <g key={v}>
                <circle cx="170" cy={yPosition(i, left.length)} r="27" />
                <text x="170" y={yPosition(i, left.length) + 6}>
                  {tx(v, 'studios')}
                </text>
              </g>
            )),
            'studios',
          )}
          {tx(
            right.map((v, i) => (
              <g key={v}>
                <circle cx="510" cy={yPosition(i, right.length)} r="27" />
                <text x="510" y={yPosition(i, right.length) + 6}>
                  {tx(v, 'studios')}
                </text>
              </g>
            )),
            'studios',
          )}
        </svg>
        <section>
          <h4>{tx('Matching state', 'studios')}</h4>
          <p>{tx('Blue edges are matched. An augmenting path alternates unmatched and matched edges, then flips them.', 'studios')}</p>
          <b>
            {tx('|M| = ', 'studios')}
            {tx(((r.matching ?? []) as unknown[]).length, 'studios')}
          </b>
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
        <h4>{tx(lesson.id === 'bridges' ? 'Bridge criterion' : 'Articulation criterion', 'studios')}</h4>
        <p>
          {tx(
            lesson.id === 'bridges'
              ? 'Tree edge (u,v) is a bridge exactly when low[v] > disc[u].'
              : 'A non-root u is a cut vertex when some child v has low[v] ≥ disc[u]. A DFS root needs at least two children.',
            'studios',
          )}
        </p>
        <div className="tuv-label-grid">
          {tx(
            graph?.labels?.map((label, i) => (
              <span key={i}>
                <b>
                  {tx('v', 'studios')}
                  {tx(i, 'studios')}
                </b>
                {tx(label || '—', 'studios')}
              </span>
            )),
            'studios',
          )}
        </div>
        <strong>
          {tx('Result: ', 'studios')}
          {tx(JSON.stringify(lesson.id === 'bridges' ? r.bridges : r.articulation), 'studios')}
        </strong>
      </section>
    </div>
  )
}

function EulerStudio({ input, state, result }: Props) {
  useLocaleRender()

  const degrees = Array.from({ length: input.vertices ?? 0 }, (_, v) => (input.edges ?? []).filter((e) => e.from === v || e.to === v).length),
    trail = state?.values ?? ((result as ResultRecord | undefined)?.trail as unknown[]) ?? []
  return (
    <div className="tuv-euler">
      <section>
        <h4>{tx('Degree condition', 'studios')}</h4>
        {tx(
          degrees.map((degree, i) => (
            <span className={degree % 2 ? 'odd' : ''} key={i}>
              <b>
                {tx('v', 'studios')}
                {tx(i, 'studios')}
              </b>
              {tx('degree ', 'studios')}
              {tx(degree, 'studios')}
            </span>
          )),
          'studios',
        )}
      </section>
      <section>
        <h4>{tx('Edge-consumption stack', 'studios')}</h4>
        <div>
          {tx(
            trail.map((v, i) => (
              <span key={i}>
                {tx(String(v), 'studios')}
                {tx(i < trail.length - 1 && <i>→</i>, 'studios')}
              </span>
            )),
            'studios',
          )}
        </div>
        <p>
          {tx(
            degrees.filter((d) => d % 2).length === 0
              ? 'All degrees are even: an Eulerian circuit may exist.'
              : 'Exactly two odd vertices are required for an open Eulerian trail.',
            'studios',
          )}
        </p>
      </section>
    </div>
  )
}

function StringStudio({ lesson, input, state, result, step }: Props) {
  useLocaleRender()

  if (lesson.id === 'suffix-array')
    return (
      <div className="tuv-suffix">
        <section>
          <h4>
            {tx('Suffixes of “', 'studios')}
            {tx(input.text, 'studios')}”
          </h4>
          {tx(
            Array.from(input.text ?? '').map((_, i) => (
              <span key={i}>
                <b>{tx(i, 'studios')}</b>
                {tx(input.text?.slice(i), 'studios')}
              </span>
            )),
            'studios',
          )}
        </section>
        <section>
          <h4>{tx('Lexicographic order', 'studios')}</h4>
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
        {tx(
          Array.from(text).map((ch, i) => (
            <span key={i}>
              <small>{tx(i, 'studios')}</small>
              {tx(ch, 'studios')}
            </span>
          )),
          'studios',
        )}
      </div>
      <div className="tuv-character-row pattern" style={{ paddingLeft: `${offset * 46}px` }}>
        {tx(
          Array.from(pattern).map((ch, i) => <span key={i}>{tx(ch, 'studios')}</span>),
          'studios',
        )}
      </div>
      <div className="tuv-bad-table">
        <b>{tx('Rightmost occurrence', 'studios')}</b>
        {tx(
          Object.entries(last).map(([ch, i]) => (
            <span key={ch}>
              {tx(ch, 'studios')} → {tx(i, 'studios')}
            </span>
          )),
          'studios',
        )}
      </div>
      <p>
        {tx('Matches: ', 'studios')}
        {tx(JSON.stringify((result as ResultRecord | undefined)?.matches ?? []), 'studios')}
        {tx('. Shift safely using the rightmost compatible occurrence.', 'studios')}
      </p>
    </div>
  )
}

function KaratsubaStudio({ input, state, result }: Props) {
  useLocaleRender()

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
          {tx('x = ', 'studios')}
          <b>{tx(highX, 'studios')}</b>·10ᵐ + <b>{tx(lowX, 'studios')}</b>
        </span>
        <span>
          {tx('y = ', 'studios')}
          <b>{tx(highY, 'studios')}</b>·10ᵐ + <b>{tx(lowY, 'studios')}</b>
        </span>
      </div>
      <section>
        {tx(
          (state?.values ?? []).map((v, i) => (
            <span key={i}>
              <small>{tx(['z₂ = ac', 'z₀ = bd', 'z₁ = (a+b)(c+d)−z₂−z₀'][i] ?? `product ${i + 1}`, 'studios')}</small>
              <b>{tx(String(v), 'studios')}</b>
            </span>
          )),
          'studios',
        )}
      </section>
      <p>
        {tx('xy = z₂·10²ᵐ + z₁·10ᵐ + z₀ = ', 'studios')}
        <b>{tx(String((result as ResultRecord | undefined)?.product ?? '—'), 'studios')}</b>
      </p>
    </div>
  )
}

export function ConceptStudio({ lesson, step }: { lesson: Lesson; step: number }) {
  useLocaleRender()

  const process = lesson.pseudocode.length ? lesson.pseudocode : ['State the problem', 'Choose a model', 'Advance the state', 'Prove the invariant', 'Conclude']
  return (
    <div className="tuv-concept">
      <section>
        <h4>{tx('Core idea', 'studios')}</h4>
        <p>{tx(lesson.summary, 'studios')}</p>
        <blockquote>{tx(lesson.example, 'studios')}</blockquote>
      </section>
      <div className="tuv-concept-flow">
        {tx(
          process.slice(0, 5).map((line, i) => (
            <div className={i === Math.min(step, 4) ? 'active' : ''} key={i}>
              <span>{tx(i + 1, 'studios')}</span>
              <p>{tx(line, 'studios')}</p>
            </div>
          )),
          'studios',
        )}
      </div>
      <section>
        <h4>{tx('Why it works', 'studios')}</h4>
        <p>{tx(lesson.correctness, 'studios')}</p>
        <b>
          {tx(lesson.time, 'studios')}
          {tx(' time · ', 'studios')}
          {tx(lesson.space, 'studios')}
          {tx(' space', 'studios')}
        </b>
      </section>
    </div>
  )
}

export function RichLessonScene(props: Props) {
  useLocaleRender()

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
