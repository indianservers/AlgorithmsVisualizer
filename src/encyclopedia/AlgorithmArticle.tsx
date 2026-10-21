import { Link } from 'react-router-dom'
import type { AlgorithmModule } from '../types'
import { allModules } from '../algorithms'
import { algorithmPath, learnPath } from '../utils/routing'
import { articleSections, encyclopediaFor } from './content'
import './encyclopedia.css'

export function AlgorithmArticle({ module }: { module: AlgorithmModule }) {
  const t = encyclopediaFor(module)
  const related = allModules
    .filter((m) => m.id !== module.id && (t.related.includes(m.id) || m.category === module.category))
    .sort((a, b) => Number(t.related.includes(b.id)) - Number(t.related.includes(a.id)))
    .slice(0, 6)
  const sectionTitle = (id: string, title: string) => (
    <h2>
      <a className="wiki-heading-link" href={`#${id}`} aria-label={`Bookmark ${title}`}>
        {title}
        <span aria-hidden="true"> #</span>
      </a>
    </h2>
  )
  return (
    <article className="algorithm-article" aria-label={`${module.name} encyclopedia`}>
      <header className="wiki-intro">
        <p className="wiki-eyebrow">ALGORITHM ENCYCLOPEDIA · {module.category}</p>
        <h1>{module.name}</h1>
        <p className="wiki-deck">Definition, purpose, step-by-step explanation, worked examples and analysis.</p>
        <div className="wiki-tags">
          {(module.flags ?? [module.category, t.method]).map((f, i) => (
            <span key={`${f}-${i}`}>{f}</span>
          ))}
        </div>
        {t.overview && (
          <p className="wiki-note">
            This page explains a topic family or learning tool. Follow the related links for the individual algorithms and their precise guarantees.
          </p>
        )}
      </header>
      <div className="wiki-body">
        <nav className="wiki-contents" aria-label="On this page">
          <strong>On this page</strong>
          {articleSections.map(([id, title]) => (
            <a key={id} href={`#${id}`}>
              {title}
            </a>
          ))}
          <Link className="wiki-try" to={algorithmPath(module)}>
            Try the visualization →
          </Link>
        </nav>
        <div className="wiki-sections">
          <section id="overview">
            {sectionTitle('overview', `What is ${module.name}?`)}
            <p>{t.definition}</p>
            <p>{t.intuition}</p>
          </section>
          <section id="purpose">
            {sectionTitle('purpose', 'Purpose and applications')}
            <p>{t.purpose}</p>
            <h3>What problem does it solve?</h3>
            <p>{t.idea}</p>
          </section>
          <section id="how-it-works">
            {sectionTitle('how-it-works', 'How it works, step by step')}
            {t.steps.length ? (
              <ol className="wiki-steps">
                {t.steps.map((step, i) => (
                  <li key={i}>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>{t.intuition}</p>
            )}
            <p className="wiki-note">
              Read the input assumptions before tracing. A method can produce a plausible result on one example while failing on inputs outside its contract.
            </p>
          </section>
          <section id="worked-example">
            {sectionTitle('worked-example', 'Worked example')}
            <blockquote>{t.example}</blockquote>
            {module.id === 'selection-sort' && (
              <>
                <p>
                  For input [64, 25, 12, 22, 11], the sorted prefix begins empty. The vertical divider below separates the final prefix from the values that
                  still need a scan.
                </p>
                <div className="wiki-table-wrap">
                  <table>
                    <caption>Selection sort passes in ascending order</caption>
                    <thead>
                      <tr>
                        <th>Pass</th>
                        <th>Minimum chosen</th>
                        <th>Array after the pass</th>
                        <th>Why it is final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['1', '11', '11 | 25, 12, 22, 64', '11 is the smallest of all five values.'],
                        ['2', '12', '11, 12 | 25, 22, 64', '12 is smallest among the four remaining values.'],
                        ['3', '22', '11, 12, 22 | 25, 64', 'Only the remaining suffix is scanned.'],
                        ['4', '25', '11, 12, 22, 25 | 64', '25 is already in place, so no exchange is needed.'],
                      ].map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, i) => (
                            <td key={i}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  The inner loop changes minIndex when it discovers a smaller candidate. The array changes only after the scan finishes. The final value needs
                  no extra pass because all smaller values are already placed.
                </p>
              </>
            )}
            <h3>Trace it yourself</h3>
            <p>
              Write the state before the first action. Follow one instruction at a time, record what changes and explain what stays true. Compare your predicted
              next action with the visualization, then try a boundary case from the assumptions below.
            </p>
            <Link to={algorithmPath(module)}>Open {module.name} visualization →</Link>
          </section>
          <section id="correctness">
            {sectionTitle('correctness', 'Why it works: correctness and invariant')}
            <p>{t.proof}</p>
            <p>
              A correctness argument needs both a preserved property and termination. Check the initial state, explain why each permitted update preserves the
              property, then show that the stopping condition implies the required result.
            </p>
            {module.id === 'selection-sort' && (
              <p>
                Before pass i, the first i positions contain exactly the i smallest input values in nondecreasing order. The full suffix scan identifies the
                next smallest value. Exchanging it into position i extends the prefix without losing any values. After n − 1 passes, only the largest remaining
                value is left, so the entire array is sorted.
              </p>
            )}
          </section>
          <section id="complexity">
            {sectionTitle('complexity', 'Time and space complexity')}
            <div className="wiki-table-wrap">
              <table>
                <caption>Published bounds for this page’s model</caption>
                <thead>
                  <tr>
                    <th>Best time</th>
                    <th>Average time</th>
                    <th>Worst time</th>
                    <th>Auxiliary space</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{module.complexity.best}</td>
                    <td>{module.complexity.average}</td>
                    <td>{module.complexity.worst}</td>
                    <td>{module.complexity.space}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>{t.analysis}</p>
            {module.id === 'selection-sort' && (
              <>
                <p>
                  The first scan compares n − 1 candidates, the next compares n − 2, and the final useful scan compares one. Their sum is n(n − 1)/2. With five
                  values this is 4 + 3 + 2 + 1 = 10 comparisons, regardless of the starting order.
                </p>
                <p>
                  At most one useful exchange occurs per pass, giving at most n − 1 swaps. Counting comparisons and swaps separately explains why selection sort
                  can be relevant when writes are costly even though its total time remains quadratic.
                </p>
              </>
            )}
            <p>
              Algorithm workspace and visualization storage are different costs. The interface may retain arrays, graphs or tables for many steps; those
              snapshots are not included in a textbook auxiliary-space bound unless explicitly stated.
            </p>
          </section>
          <section id="trade-offs">
            {sectionTitle('trade-offs', 'Advantages, limitations and when to use it')}
            <h3>Advantages</h3>
            <ul>
              {t.advantages.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
            <h3>Limitations</h3>
            <ul>
              {t.disadvantages.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
            <h3>Input assumptions and edge cases</h3>
            <p>{t.limits}</p>
            {module.id === 'selection-sort' && (
              <p>
                Empty and single-value arrays are already sorted. Negative values use the same ordering comparisons as positive values. Duplicate values are
                supported, but record stability is different: swapping the first 2 in [2ₐ, 2ᵦ, 1] with 1 produces [1, 2ᵦ, 2ₐ], reversing the equal records.
              </p>
            )}
          </section>
          <section id="implementation">
            {sectionTitle('implementation', 'Pseudocode and implementation')}
            <pre>
              <code>{t.steps.map((x, i) => `${i + 1}. ${x}`).join('\n') || t.idea}</code>
            </pre>
            <p>
              Translate each action into a state update, keep the termination condition explicit, and test the edge cases before optimizing. Open the
              visualization’s Code tab to connect its execution to the displayed implementation.
            </p>
            {module.id === 'selection-sort' && (
              <pre>
                <code>{`function selectionSort(values) {
  const a = values; // Sort the supplied array in place.
  for (let i = 0; i < a.length - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIndex]) minIndex = j;
    }
    if (minIndex !== i) [a[i], a[minIndex]] = [a[minIndex], a[i]];
  }
  return a;
}`}</code>
              </pre>
            )}
          </section>
          <section id="common-mistakes">
            {sectionTitle('common-mistakes', 'Common mistakes and misconceptions')}
            <ul>
              {t.mistakes.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>
          <section id="faq">
            {sectionTitle('faq', 'Questions and answers')}
            <h3>{t.question}</h3>
            <p>{t.answer}</p>
            <h3>How should I choose between related methods?</h3>
            <p>
              Compare the input preconditions, the exact output contract, worst-case cost and memory requirements. Use the related pages below to examine a
              different strategy on the same problem. A faster result on one small example does not establish a better asymptotic bound.
            </p>
          </section>
          <section id="related">
            {sectionTitle('related', 'Related topics')}
            <div className="wiki-related">
              {related.map((m) => (
                <Link to={learnPath(m)} key={m.id}>
                  <strong>{m.name}</strong>
                  <span>{m.summary}</span>
                </Link>
              ))}
            </div>
            <Link to="/encyclopedia">Browse the complete algorithm encyclopedia →</Link>
          </section>
          <section id="references">
            {sectionTitle('references', 'References and further reading')}
            <p>
              These original explanations combine this project’s algorithm definitions, implementation notes and worked examples. Use the following references
              for further study.
            </p>
            <ul>
              <li>
                <a href="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/" target="_blank" rel="noreferrer">
                  MIT OpenCourseWare — Introduction to Algorithms
                </a>
              </li>
              <li>
                <a href="https://www.nist.gov/dads" target="_blank" rel="noreferrer">
                  NIST — Dictionary of Algorithms and Data Structures
                </a>
              </li>
              {module.id === 'selection-sort' && (
                <li>
                  <a href="https://www.geeksforgeeks.org/dsa/selection-sort-algorithm-2/" target="_blank" rel="noreferrer">
                    GeeksforGeeks — Selection Sort (requested reference)
                  </a>
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </article>
  )
}
