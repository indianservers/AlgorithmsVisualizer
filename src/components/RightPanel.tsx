// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import type { Dispatch, SetStateAction } from 'react'
import { BookOpen, Braces, Hash } from 'lucide-react'
import type { AlgorithmModule, AlgorithmStep, LearningTab } from '../types'
import { metricRules } from '../algorithms/metrics'
import { DaaTheoryView } from './DaaTheoryView'
import { daaTheoryFor } from '../guides/daaTheory'

type Guide = {
  compareWith: string[]
  concept: string
  interview: string[]
  misconceptions: string[]
  objectives: string[]
  path: string
  prerequisites: string[]
  quiz: { a: string; q: string }[]
  trap: string
  useCase: string
}

type RightPanelProps = {
  activeModule: AlgorithmModule
  codeView: { activeIndex: number; lines: string[] }
  completed: string[]
  copyText: (label: string, value: string) => void
  correctnessText: string
  currentStep?: AlgorithmStep
  difficulty: string
  guide: Guide
  hugeRunWarning: string
  inputConstraints: string[]
  learningTab: LearningTab
  nextStep?: AlgorithmStep
  notes: Record<string, string>
  practiceGuess: string
  practiceReveal: boolean
  pseudoActiveIndex: number
  quizScore: { correct: number; total: number }
  recommendation: string
  reviewDueDate?: string
  resultText: string
  rightPanelWidth: number
  setLearningTab: Dispatch<SetStateAction<LearningTab>>
  setNotes: Dispatch<SetStateAction<Record<string, string>>>
  setPracticeGuess: Dispatch<SetStateAction<string>>
  setPracticeReveal: Dispatch<SetStateAction<boolean>>
  setQuizScore: Dispatch<SetStateAction<{ correct: number; total: number }>>
  setRightPanelWidth: Dispatch<SetStateAction<number>>
  setStepIndex: Dispatch<SetStateAction<number>>
  stepIndex: number
  steps: AlgorithmStep[]
  stepReason: (step?: AlgorithmStep) => string
  toggleComplete: (id: string) => void
}

export function RightPanel({
  activeModule,
  codeView,
  completed,
  copyText,
  correctnessText,
  currentStep,
  guide,
  hugeRunWarning,
  inputConstraints,
  learningTab,
  nextStep,
  notes,
  practiceGuess,
  practiceReveal,
  pseudoActiveIndex,
  quizScore,
  recommendation,
  reviewDueDate,
  resultText,
  rightPanelWidth,
  setNotes,
  setPracticeGuess,
  setPracticeReveal,
  setQuizScore,
  setRightPanelWidth,
  setStepIndex,
  stepIndex,
  steps,
  stepReason,
  toggleComplete,
}: RightPanelProps) {
  useLocaleRender()

  return (
    <aside className="right-panel" data-learning-tab={learningTab}>
      <section className="panel-tools desktop-panel-tools">
        <h2>{tx('Panel', 'common')}</h2>
        <label>
          {tx('Width', 'common')}
          <input min={300} max={560} step={20} type="range" value={rightPanelWidth} onChange={(event) => setRightPanelWidth(Number(event.target.value))} />
        </label>
      </section>
      <section className="timeline-inspector">
        <h2>
          <BookOpen size={18} />
          {tx(' Explanation', 'common')}
        </h2>

        {tx(
          resultText && (
            <div className={`result-banner ${resultText.includes('not') || resultText.includes('absent') ? 'miss' : 'hit'}`}>{tx(resultText, 'common')}</div>
          ),
          'common',
        )}
        {tx(
          correctnessText && (
            <div className={`result-banner ${correctnessText.includes('not') || correctnessText.includes('required') ? 'miss' : 'hit'}`}>
              {tx(correctnessText, 'common')}
            </div>
          ),
          'common',
        )}
        <p>{tx(currentStep?.description ?? 'Choose a live algorithm and press Run to generate timeline events.', 'common')}</p>
        <div className="reason-card">{tx(stepReason(currentStep), 'common')}</div>
        {tx(
          learningTab !== 'Visualization' && (
            <div className="step-meter">
              <span>
                {tx('Step ', 'common')}
                {tx(steps.length ? stepIndex + 1 : 0, 'common')} / {tx(steps.length, 'common')}
              </span>
              <input
                disabled={!steps.length}
                max={Math.max(0, steps.length - 1)}
                min={0}
                type="range"
                value={stepIndex}
                onChange={(event) => setStepIndex(Number(event.target.value))}
              />
              <div className="timeline-map">
                {tx(
                  steps.map((step, index) => (
                    <button
                      className={index === stepIndex ? 'active' : step.type}
                      key={step.id}
                      type="button"
                      onClick={() => setStepIndex(index)}
                      title={tx(`${index + 1}. ${step.type}`, 'common')}
                    />
                  )),
                  'common',
                )}
              </div>
            </div>
          ),
          'common',
        )}
      </section>
      {tx(
        learningTab === 'Learn' && (
          <section className="guide-panel">
            <h2>{tx('DAA learning', 'common')}</h2>
            <DaaTheoryView module={activeModule} />
            <h3>{tx('Visualizer input requirements', 'common')}</h3>
            <ul>
              {tx(
                inputConstraints.map((c) => <li key={c}>{tx(c, 'common')}</li>),
                'common',
              )}
            </ul>
            <button className="mini-action" type="button" onClick={() => toggleComplete(activeModule.id)}>
              {tx(completed.includes(activeModule.id) ? 'Mark not complete' : 'Mark complete', 'common')}
            </button>
          </section>
        ),
        'common',
      )}
      {tx(
        learningTab === 'Visualization' && (
          <section className="guide-panel">
            <h2>{tx('Visualization guide', 'common')}</h2>
            <p>
              {tx(
                'Inspect highlighted values, variables and the current operation. Step forward or backward, or seek with the timeline; the Learn and Code tabs explain the underlying method.',
                'common',
              )}
            </p>
            <p>{tx(stepReason(currentStep), 'common')}</p>
          </section>
        ),
        'common',
      )}
      {tx(
        learningTab === 'Code' && (
          <section className="guide-panel">
            <h2>{tx('Code Walkthrough', 'common')}</h2>
            <pre className="code-lines">
              {(daaTheoryFor(activeModule).code || codeView.lines.join('\n')).split('\n').map((line, index) => (
                <span
                  className={daaTheoryFor(activeModule).code === activeModule.code && index === codeView.activeIndex ? 'active-line' : ''}
                  key={`${index}-${line}`}
                >
                  {line || ' '}
                </span>
              ))}
            </pre>
            <p>{tx('Read the pseudocode first, then map each animation step to the corresponding code line.', 'common')}</p>
            <details className="runner-source">
              <summary>{tx('Actual visualization runner source', 'common')}</summary>
              <p>
                {tx(
                  'This function uses shared tracing helpers. The compact textbook fragment may omit instrumentation; suite runners demonstrate only their stated scope.',
                  'common',
                )}
              </p>
              <pre>{activeModule.runner?.toString() ?? 'This page has no executable legacy runner.'}</pre>
            </details>
          </section>
        ),
        'common',
      )}
      {tx(
        learningTab === 'Practice' && (
          <section className="guide-panel">
            <h2>{tx('Practice Mode', 'common')}</h2>
            <p>{tx('Predict the next operation before stepping forward.', 'common')}</p>
            <div className="quiz-card">
              {tx('Current operation: ', 'common')}
              {tx(currentStep?.type ?? 'not started', 'common')}
            </div>
            <label className="practice-guess">
              {tx('Your next-step prediction', 'common')}
              <input value={practiceGuess} onChange={(event) => setPracticeGuess(event.target.value)} placeholder={tx('compare, swap, update...', 'common')} />
            </label>
            {tx(
              practiceGuess && nextStep && (
                <div className={`quiz-card ${nextStep.type.toLowerCase() === practiceGuess.trim().toLowerCase() ? 'correct' : 'missed'}`}>
                  {tx(
                    nextStep.type.toLowerCase() === practiceGuess.trim().toLowerCase()
                      ? 'Prediction matches the next operation.'
                      : `Next operation is ${nextStep.type}.`,
                    'common',
                  )}
                </div>
              ),
              'common',
            )}
            <button className="mini-action" type="button" onClick={() => setPracticeReveal((value) => !value)}>
              {tx(practiceReveal ? 'Hide answer' : 'Reveal next-step hint', 'common')}
            </button>
            {tx(
              practiceReveal && (
                <div className="quiz-card">
                  {tx('Hint: ', 'common')}
                  {tx(steps[stepIndex + 1]?.description ?? 'You are at the final step.', 'common')}
                </div>
              ),
              'common',
            )}
            <div className="visual-legend">
              <span className="red" />
              {tx(' active ', 'common')}
              <span className="green" />
              {tx(' completed/visited ', 'common')}
              <span className="blue" />
              {tx(' normal', 'common')}
            </div>
            <h2>{tx('DAA reasoning practice', 'common')}</h2>
            <p>{tx(daaTheoryFor(activeModule).question, 'common')}</p>
            <label className="practice-guess">
              {tx('Your explanation', 'common')}
              <textarea rows={4} placeholder={tx('State the invariant, apply it to the example, and justify your answer.', 'common')} />
            </label>
            <details className="quiz-card">
              <summary>{tx('Reveal DAA explanation', 'common')}</summary>
              <p>{tx(daaTheoryFor(activeModule).answer, 'common')}</p>
            </details>
            <h2>{tx('Quiz', 'common')}</h2>
            <div className="quiz-score">
              {tx('Score ', 'common')}
              {tx(quizScore.correct, 'common')} / {tx(quizScore.total, 'common')}
            </div>
            {tx(
              guide.quiz.map((item) => (
                <details className="quiz-card" key={item.q}>
                  <summary>{tx(item.q, 'common')}</summary>
                  <p>{tx(item.a, 'common')}</p>
                  <button type="button" onClick={() => setQuizScore((score) => ({ correct: score.correct + 1, total: score.total + 1 }))}>
                    {tx('I knew this', 'common')}
                  </button>
                  <button type="button" onClick={() => setQuizScore((score) => ({ ...score, total: score.total + 1 }))}>
                    {tx('Review later', 'common')}
                  </button>
                </details>
              )),
              'common',
            )}
            <h3>{tx('Interview prompts', 'common')}</h3>
            <ul>
              {tx(
                guide.interview.map((item) => <li key={item}>{tx(item, 'common')}</li>),
                'common',
              )}
            </ul>
          </section>
        ),
        'common',
      )}
      {tx(
        learningTab === 'Experiments' && (
          <section className="guide-panel">
            <h2>{tx('Experiments', 'common')}</h2>
            <p>{tx('Run best, average, and worst inputs. Compare step count, comparisons, writes, and memory behavior.', 'common')}</p>
            {tx(hugeRunWarning && <div className="run-disabled-reason">{tx(hugeRunWarning, 'common')}</div>, 'common')}
            <div className="quiz-card">
              {tx('Spaced repetition:', 'common')}
              {tx(' ', 'common')}
              {tx(
                completed.includes(activeModule.id)
                  ? `Review due ${reviewDueDate ? new Date(reviewDueDate).toLocaleDateString() : 'tomorrow'} to lock it in.`
                  : 'Mark complete after you can explain the final step without hints.',
                'common',
              )}
            </div>
            <h3>{tx('Explain current step simply', 'common')}</h3>
            <p>
              {tx(
                currentStep
                  ? `This step ${currentStep.type}s because ${currentStep.reason?.toLowerCase() ?? 'the algorithm is moving forward.'}`
                  : 'Run the algorithm to see a simple step explanation.',
                'common',
              )}
            </p>
            <h3>{tx('Explain technically', 'common')}</h3>
            <p>
              {tx(
                currentStep
                  ? `Operation ${currentStep.operationId ?? currentStep.id} maps to pseudocode line ${currentStep.pseudocodeLine ?? '-'} and code line ${currentStep.codeLine ?? '-'}.`
                  : 'Technical mapping appears after a run starts.',
                'common',
              )}
            </p>
            <div className="complexity-curves">
              {tx(
                ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'].map((label, i) => (
                  <span key={label} style={{ height: `${24 + i * 18}%` }}>
                    {tx(label, 'common')}
                  </span>
                )),
                'common',
              )}
            </div>
            <textarea
              value={notes[activeModule.id] ?? ''}
              onChange={(event) => setNotes((value) => ({ ...value, [activeModule.id]: event.target.value }))}
              placeholder={tx('Local notes for this algorithm', 'common')}
              rows={4}
            />
          </section>
        ),
        'common',
      )}
      <section className="simulation-inspector">
        <h2>
          <Hash size={18} />
          {tx(' Variables', 'common')}
        </h2>
        <pre>{JSON.stringify(currentStep?.highlights.variables ?? { mode: activeModule.visualMode }, null, 2)}</pre>
        {tx(
          currentStep?.assertion && (
            <div className="quiz-card">
              {tx('Assertion: ', 'common')}
              {tx(currentStep.assertion, 'common')}
            </div>
          ),
          'common',
        )}
        <details className="json-inspector">
          <summary>{tx('Current step data', 'common')}</summary>
          <pre>{JSON.stringify(currentStep ?? {}, null, 2)}</pre>
        </details>
      </section>
      <section className="code-inspector">
        <h2>
          <Braces size={18} />
          {tx(' Pseudocode', 'common')}
        </h2>
        <button className="mini-action" type="button" onClick={() => copyText('Pseudocode', activeModule.pseudocode.join('\n'))}>
          {tx('Copy pseudocode', 'common')}
        </button>
        <ol>
          {tx(
            activeModule.pseudocode.map((line, index) => (
              <li className={index === pseudoActiveIndex ? 'active-line' : ''} key={line}>
                {tx(line, 'common')}
              </li>
            )),
            'common',
          )}
        </ol>
      </section>
      <section className="code-inspector">
        <h2>{tx('Code', 'common')}</h2>
        <button className="mini-action" type="button" onClick={() => copyText('Code', activeModule.code)}>
          {tx('Copy code', 'common')}
        </button>
        <pre>{activeModule.code}</pre>
      </section>
      <section className="learn-inspector">
        <h2>{tx('Complexity', 'common')}</h2>
        <div className="complexity-grid">
          {tx(
            Object.entries(activeModule.complexity).map(([key, value]) => (
              <span key={key}>
                <strong>{tx(key, 'common')}</strong>
                {value}
              </span>
            )),
            'common',
          )}
        </div>
      </section>
      <section className="learn-inspector">
        <h2>{tx('Learning', 'common')}</h2>
        <p>{tx(recommendation, 'common')}</p>
        <div className="progress-pill">{tx(completed.includes(activeModule.id) ? 'Completed locally' : 'Not completed yet', 'common')}</div>
        <div className="quiz-card">
          {tx('Common mistake: ', 'common')}
          {tx(guide.misconceptions[0], 'common')}
        </div>

        <details className="quiz-card">
          <summary>{tx('Metric rules', 'common')}</summary>
          <ul>
            {tx(
              metricRules.map((rule) => <li key={rule}>{tx(rule, 'common')}</li>),
              'common',
            )}
          </ul>
        </details>
        <details className="quiz-card">
          <summary>{tx('Glossary', 'common')}</summary>
          <p>
            <strong>{tx('stable', 'common')}</strong>
            {tx(': equal values keep their relative order.', 'common')}
          </p>
          <p>
            <strong>{tx('in-place', 'common')}</strong>
            {tx(': uses only small auxiliary memory.', 'common')}
          </p>
          <p>
            <strong>{tx('frontier', 'common')}</strong>
            {tx(': nodes waiting to be explored.', 'common')}
          </p>
          <p>
            <strong>{tx('pivot', 'common')}</strong>
            {tx(': value used to split a partition.', 'common')}
          </p>
          <p>
            <strong>{tx('heapify', 'common')}</strong>
            {tx(': restore heap order under a node.', 'common')}
          </p>
        </details>
      </section>
    </aside>
  )
}
