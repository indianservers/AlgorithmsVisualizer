import { Link } from 'react-router-dom'
import type { AlgorithmModule } from '../types'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { daaTheoryFor } from '../guides/daaTheory'

export function DaaTheoryView({ module }: { module: AlgorithmModule }) {
  const t = daaTheoryFor(module)
  return (
    <article className="daa-theory" aria-label={`${module.name} DAA learning material`}>
      <span className="eyebrow">DAA · {t.method}</span>
      <h2>Learn {module.name}</h2>
      <p className="lesson-scope">{t.scope}</p>
      <h3>Problem and key idea</h3>
      <p>{t.idea}</p>
      <h3>Design the method</h3>
      <ol>
        {t.designSteps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <h3>Worked example</h3>
      <blockquote>{t.example}</blockquote>
      <h3>Correctness and invariant</h3>
      <p>{t.proof}</p>
      <h3>Time and space analysis</h3>
      <p>{t.analysis}</p>
      <p>
        Count input operations separately from rendering and stored animation snapshots. State the input-size variables, best/worst assumptions and any
        key-range, graph-representation or recursion costs.
      </p>
      <h3>Assumptions, edge cases and limitations</h3>
      <p>{t.limits}</p>
      {t.related.length > 0 && (
        <>
          <h3>Dedicated DAA lessons</h3>
          <p>Continue with editable inputs, complete traces and individual proofs:</p>
          <div className="related-lessons">
            {t.related.map((id) => {
              const lesson = allModules.find((m) => m.id === id)
              return lesson ? (
                <Link to={algorithmPath(lesson)} key={id}>
                  {lesson.name}
                </Link>
              ) : null
            })}
          </div>
        </>
      )}
      <p>
        <Link to="/daa/syllabus-dashboard">DAA concepts and learning path</Link>
      </p>
    </article>
  )
}
