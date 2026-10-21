// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { Link } from 'react-router-dom'
import type { AlgorithmModule } from '../types'
import { allModules } from '../algorithms'
import { algorithmPath, learnPath } from '../utils/routing'
import { articleSections, encyclopediaFor } from './content'
import './encyclopedia.css'

export function AlgorithmArticle({ module }: { module: AlgorithmModule }) {
  useLocaleRender()

  const t = encyclopediaFor(module)
  const related = allModules
    .filter((m) => m.id !== module.id && (t.related.includes(m.id) || m.category === module.category))
    .sort((a, b) => Number(t.related.includes(b.id)) - Number(t.related.includes(a.id)))
    .slice(0, 6)
  const sectionTitle = (id: string, title: string) => (
    <h2>
      <a className="wiki-heading-link" href={`#${id}`} aria-label={tx(`Bookmark ${title}`, 'common')}>
        {tx(title, 'common')}
        <span aria-hidden="true"> #</span>
      </a>
    </h2>
  )
  return (
    <article className="algorithm-article" aria-label={tx(`${module.name} encyclopedia`, 'common')}>
      <header className="wiki-intro">
        <p className="wiki-eyebrow">
          {tx('ALGORITHM ENCYCLOPEDIA · ', 'common')}
          {tx(module.category, 'common')}
        </p>
        <h1>{tx(module.name, 'common')}</h1>
        <p className="wiki-deck">{tx('Definition, purpose, step-by-step explanation, worked examples and analysis.', 'common')}</p>
        <div className="wiki-tags">
          {tx(
            (module.flags ?? [module.category, t.method]).map((f, i) => <span key={`${f}-${i}`}>{tx(f, 'common')}</span>),
            'common',
          )}
        </div>
        {tx(
          t.overview && (
            <p className="wiki-note">
              {tx(
                'This page explains a topic family or learning tool. Follow the related links for the individual algorithms and their precise guarantees.',
                'common',
              )}
            </p>
          ),
          'common',
        )}
      </header>
      <div className="wiki-body">
        <nav className="wiki-contents" aria-label={tx('On this page', 'common')}>
          <strong>{tx('On this page', 'common')}</strong>
          {tx(
            articleSections.map(([id, title]) => (
              <a key={id} href={`#${id}`}>
                {tx(title, 'common')}
              </a>
            )),
            'common',
          )}
          <Link className="wiki-try" to={algorithmPath(module)}>
            {tx('Try the visualization →', 'common')}
          </Link>
        </nav>
        <div className="wiki-sections">
          <section id="overview">
            {tx(sectionTitle('overview', `What is ${module.name}?`), 'common')}
            <p>{tx(t.definition, 'common')}</p>
            <p>{tx(t.intuition, 'common')}</p>
          </section>
          <section id="purpose">
            {tx(sectionTitle('purpose', 'Purpose and applications'), 'common')}
            <p>{tx(t.purpose, 'common')}</p>
            <h3>{tx('What problem does it solve?', 'common')}</h3>
            <p>{tx(t.idea, 'common')}</p>
          </section>
          <section id="how-it-works">
            {tx(sectionTitle('how-it-works', 'How it works, step by step'), 'common')}
            {tx(
              t.steps.length ? (
                <ol className="wiki-steps">
                  {tx(
                    t.steps.map((step, i) => (
                      <li key={i}>
                        <p>{tx(step, 'common')}</p>
                      </li>
                    )),
                    'common',
                  )}
                </ol>
              ) : (
                <p>{tx(t.intuition, 'common')}</p>
              ),
              'common',
            )}
            <p className="wiki-note">
              {tx(
                'Read the input assumptions before tracing. A method can produce a plausible result on one example while failing on inputs outside its contract.',
                'common',
              )}
            </p>
          </section>
          <section id="worked-example">
            {tx(sectionTitle('worked-example', 'Worked example'), 'common')}
            <blockquote>{tx(t.example, 'common')}</blockquote>
            {tx(
              module.id === 'selection-sort' && (
                <>
                  <p>
                    {tx(
                      'For input [64, 25, 12, 22, 11], the sorted prefix begins empty. The vertical divider below separates the final prefix from the values that still need a scan.',
                      'common',
                    )}
                  </p>
                  <div className="wiki-table-wrap">
                    <table>
                      <caption>{tx('Selection sort passes in ascending order', 'common')}</caption>
                      <thead>
                        <tr>
                          <th>{tx('Pass', 'common')}</th>
                          <th>{tx('Minimum chosen', 'common')}</th>
                          <th>{tx('Array after the pass', 'common')}</th>
                          <th>{tx('Why it is final', 'common')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tx(
                          [
                            ['1', '11', '11 | 25, 12, 22, 64', '11 is the smallest of all five values.'],
                            ['2', '12', '11, 12 | 25, 22, 64', '12 is smallest among the four remaining values.'],
                            ['3', '22', '11, 12, 22 | 25, 64', 'Only the remaining suffix is scanned.'],
                            ['4', '25', '11, 12, 22, 25 | 64', '25 is already in place, so no exchange is needed.'],
                          ].map((row) => (
                            <tr key={row[0]}>
                              {tx(
                                row.map((cell, i) => <td key={i}>{cell}</td>),
                                'common',
                              )}
                            </tr>
                          )),
                          'common',
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    {tx(
                      'The inner loop changes minIndex when it discovers a smaller candidate. The array changes only after the scan finishes. The final value needs no extra pass because all smaller values are already placed.',
                      'common',
                    )}
                  </p>
                </>
              ),
              'common',
            )}
            <h3>{tx('Trace it yourself', 'common')}</h3>
            <p>
              {tx(
                'Write the state before the first action. Follow one instruction at a time, record what changes and explain what stays true. Compare your predicted next action with the visualization, then try a boundary case from the assumptions below.',
                'common',
              )}
            </p>
            <Link to={algorithmPath(module)}>
              {tx('Open ', 'common')}
              {tx(module.name, 'common')}
              {tx(' visualization →', 'common')}
            </Link>
          </section>
          <section id="correctness">
            {tx(sectionTitle('correctness', 'Why it works: correctness and invariant'), 'common')}
            <p>{tx(t.proof, 'common')}</p>
            <p>
              {tx(
                'A correctness argument needs both a preserved property and termination. Check the initial state, explain why each permitted update preserves the property, then show that the stopping condition implies the required result.',
                'common',
              )}
            </p>
            {tx(
              module.id === 'selection-sort' && (
                <p>
                  {tx(
                    'Before pass i, the first i positions contain exactly the i smallest input values in nondecreasing order. The full suffix scan identifies the next smallest value. Exchanging it into position i extends the prefix without losing any values. After n − 1 passes, only the largest remaining value is left, so the entire array is sorted.',
                    'common',
                  )}
                </p>
              ),
              'common',
            )}
          </section>
          <section id="complexity">
            {tx(sectionTitle('complexity', 'Time and space complexity'), 'common')}
            <div className="wiki-table-wrap">
              <table>
                <caption>{tx('Published bounds for this page’s model', 'common')}</caption>
                <thead>
                  <tr>
                    <th>{tx('Best time', 'common')}</th>
                    <th>{tx('Average time', 'common')}</th>
                    <th>{tx('Worst time', 'common')}</th>
                    <th>{tx('Auxiliary space', 'common')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{tx(module.complexity.best, 'common')}</td>
                    <td>{tx(module.complexity.average, 'common')}</td>
                    <td>{tx(module.complexity.worst, 'common')}</td>
                    <td>{tx(module.complexity.space, 'common')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>{tx(t.analysis, 'common')}</p>
            {tx(
              module.id === 'selection-sort' && (
                <>
                  <p>
                    {tx(
                      'The first scan compares n − 1 candidates, the next compares n − 2, and the final useful scan compares one. Their sum is n(n − 1)/2. With five values this is 4 + 3 + 2 + 1 = 10 comparisons, regardless of the starting order.',
                      'common',
                    )}
                  </p>
                  <p>
                    {tx(
                      'At most one useful exchange occurs per pass, giving at most n − 1 swaps. Counting comparisons and swaps separately explains why selection sort can be relevant when writes are costly even though its total time remains quadratic.',
                      'common',
                    )}
                  </p>
                </>
              ),
              'common',
            )}
            <p>
              {tx(
                'Algorithm workspace and visualization storage are different costs. The interface may retain arrays, graphs or tables for many steps; those snapshots are not included in a textbook auxiliary-space bound unless explicitly stated.',
                'common',
              )}
            </p>
          </section>
          <section id="trade-offs">
            {tx(sectionTitle('trade-offs', 'Advantages, limitations and when to use it'), 'common')}
            <h3>{tx('Advantages', 'common')}</h3>
            <ul>
              {tx(
                t.advantages.map((x, i) => <li key={i}>{x}</li>),
                'common',
              )}
            </ul>
            <h3>{tx('Limitations', 'common')}</h3>
            <ul>
              {tx(
                t.disadvantages.map((x, i) => <li key={i}>{x}</li>),
                'common',
              )}
            </ul>
            <h3>{tx('Input assumptions and edge cases', 'common')}</h3>
            <p>{tx(t.limits, 'common')}</p>
            {tx(
              module.id === 'selection-sort' && (
                <p>
                  {tx(
                    'Empty and single-value arrays are already sorted. Negative values use the same ordering comparisons as positive values. Duplicate values are supported, but record stability is different: swapping the first 2 in [2ₐ, 2ᵦ, 1] with 1 produces [1, 2ᵦ, 2ₐ], reversing the equal records.',
                    'common',
                  )}
                </p>
              ),
              'common',
            )}
          </section>
          <section id="implementation">
            {tx(sectionTitle('implementation', 'Pseudocode and implementation'), 'common')}
            <pre>
              <code>{t.steps.map((x, i) => `${i + 1}. ${x}`).join('\n') || t.idea}</code>
            </pre>
            <p>
              {tx(
                'Translate each action into a state update, keep the termination condition explicit, and test the edge cases before optimizing. Open the visualization’s Code tab to connect its execution to the displayed implementation.',
                'common',
              )}
            </p>
            {tx(
              module.id === 'selection-sort' && (
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
              ),
              'common',
            )}
          </section>
          <section id="common-mistakes">
            {tx(sectionTitle('common-mistakes', 'Common mistakes and misconceptions'), 'common')}
            <ul>
              {tx(
                t.mistakes.map((x, i) => <li key={i}>{x}</li>),
                'common',
              )}
            </ul>
          </section>
          <section id="faq">
            {tx(sectionTitle('faq', 'Questions and answers'), 'common')}
            <h3>{tx(t.question, 'common')}</h3>
            <p>{tx(t.answer, 'common')}</p>
            <h3>{tx('How should I choose between related methods?', 'common')}</h3>
            <p>
              {tx(
                'Compare the input preconditions, the exact output contract, worst-case cost and memory requirements. Use the related pages below to examine a different strategy on the same problem. A faster result on one small example does not establish a better asymptotic bound.',
                'common',
              )}
            </p>
          </section>
          <section id="related">
            {tx(sectionTitle('related', 'Related topics'), 'common')}
            <div className="wiki-related">
              {tx(
                related.map((m) => (
                  <Link to={learnPath(m)} key={m.id}>
                    <strong>{tx(m.name, 'common')}</strong>
                    <span>{tx(m.summary, 'common')}</span>
                  </Link>
                )),
                'common',
              )}
            </div>
            <Link to="/encyclopedia">{tx('Browse the complete algorithm encyclopedia →', 'common')}</Link>
          </section>
          <section id="references">
            {tx(sectionTitle('references', 'References and further reading'), 'common')}
            <p>
              {tx(
                'These original explanations combine this project’s algorithm definitions, implementation notes and worked examples. Use the following references for further study.',
                'common',
              )}
            </p>
            <ul>
              <li>
                <a href="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/" target="_blank" rel="noreferrer">
                  {tx('MIT OpenCourseWare — Introduction to Algorithms', 'common')}
                </a>
              </li>
              <li>
                <a href="https://www.nist.gov/dads" target="_blank" rel="noreferrer">
                  {tx('NIST — Dictionary of Algorithms and Data Structures', 'common')}
                </a>
              </li>
              {tx(
                module.id === 'selection-sort' && (
                  <li>
                    <a href="https://www.geeksforgeeks.org/dsa/selection-sort-algorithm-2/" target="_blank" rel="noreferrer">
                      {tx('GeeksforGeeks — Selection Sort (requested reference)', 'common')}
                    </a>
                  </li>
                ),
                'common',
              )}
            </ul>
          </section>
        </div>
      </div>
    </article>
  )
}
