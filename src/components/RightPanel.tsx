import type { Dispatch, SetStateAction } from 'react'
import { BookOpen, Braces, Hash } from 'lucide-react'
import type { AlgorithmModule, AlgorithmStep, LearningTab } from '../types'
import { metricRules } from '../algorithms/metrics'

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
  difficulty,
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
  setLearningTab,
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
  return (
    <aside className="right-panel">
      <section className="panel-tools">
        <h2>Panel</h2>
        <label>
          Width
          <input min={300} max={560} step={20} type="range" value={rightPanelWidth} onChange={(event) => setRightPanelWidth(Number(event.target.value))} />
        </label>
      </section>
      <section>
        <h2>
          <BookOpen size={18} /> Explanation
        </h2>
        <div className="learning-tabs">
          {(['Study', 'Sim', 'Code', 'Quiz', 'Experiments'] as LearningTab[]).map((tab) => (
            <button className={learningTab === tab ? 'active' : ''} key={tab} type="button" onClick={() => setLearningTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {resultText && <div className={`result-banner ${resultText.includes('not') || resultText.includes('absent') ? 'miss' : 'hit'}`}>{resultText}</div>}
        {correctnessText && (
          <div className={`result-banner ${correctnessText.includes('not') || correctnessText.includes('required') ? 'miss' : 'hit'}`}>{correctnessText}</div>
        )}
        <p>{currentStep?.description ?? 'Choose a live algorithm and press Start to generate timeline events.'}</p>
        <div className="reason-card">{stepReason(currentStep)}</div>
        <div className="step-meter">
          <span>
            Step {steps.length ? stepIndex + 1 : 0} / {steps.length}
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
            {steps.map((step, index) => (
              <button
                className={index === stepIndex ? 'active' : step.type}
                key={step.id}
                type="button"
                onClick={() => setStepIndex(index)}
                title={`${index + 1}. ${step.type}`}
              />
            ))}
          </div>
        </div>
      </section>
      {learningTab === 'Study' && (
        <section className="guide-panel">
          <h2>Study Guide</h2>
          <div className="study-meta">
            <span>
              <strong>{difficulty}</strong>difficulty
            </span>
            <span>
              <strong>{activeModule.visualMode}</strong>visual mode
            </span>
          </div>
          <p>{guide.concept}</p>
          <h3>Invariant</h3>
          <p>
            {activeModule.category === 'Sorting'
              ? 'The algorithm preserves the same values while increasing the amount of known order.'
              : activeModule.flags?.includes('Requires sorted input')
                ? 'The search range only has meaning while the input remains sorted.'
                : 'Each step preserves the data structure contract for the next operation.'}
          </p>
          <h3>Edge cases</h3>
          <p>
            {activeModule.flags?.includes('Requires sorted input')
              ? 'Empty input, duplicates, missing target, and unsorted input are the cases to test first.'
              : 'Empty input, one item, duplicates, and very large values are the quickest checks.'}
          </p>
          <h3>When to use it</h3>
          <p>
            {activeModule.flags?.includes('Requires sorted input')
              ? 'Use it when data is already sorted or sorting is acceptable before searching.'
              : activeModule.category === 'Sorting'
                ? 'Use it to understand ordering tradeoffs, data movement, and comparison counts.'
                : 'Use it when the data shape matches this visualization.'}
          </p>
          <h3>When not to use it</h3>
          <p>
            {activeModule.complexity.average.includes('n²') || activeModule.complexity.average.includes('n^2')
              ? 'Avoid it for large inputs where quadratic growth dominates.'
              : 'Avoid it when its input assumptions do not match your data.'}
          </p>
          <h3>Path</h3>
          <p>{guide.path} learning path.</p>
          <h3>Interview trap</h3>
          <p>{guide.trap}</p>
          <h3>Real-world use</h3>
          <p>{guide.useCase}</p>
          <h3>Compare with</h3>
          <div className="compare-links">
            {guide.compareWith.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <h3>Input constraints</h3>
          <ul>
            {inputConstraints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Learning objectives</h3>
          <ul>
            {guide.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Prerequisites</h3>
          <ul>
            {guide.prerequisites.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Misconceptions</h3>
          <ul>
            {guide.misconceptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button className="mini-action" type="button" onClick={() => toggleComplete(activeModule.id)}>
            {completed.includes(activeModule.id) ? 'Mark not complete' : 'Mark complete'}
          </button>
        </section>
      )}
      {learningTab === 'Sim' && (
        <section className="guide-panel">
          <h2>Practice Mode</h2>
          <p>Predict the next operation before stepping forward.</p>
          <div className="quiz-card">Current operation: {currentStep?.type ?? 'not started'}</div>
          <label className="practice-guess">
            Your next-step prediction
            <input value={practiceGuess} onChange={(event) => setPracticeGuess(event.target.value)} placeholder="compare, swap, update..." />
          </label>
          {practiceGuess && nextStep && (
            <div className={`quiz-card ${nextStep.type.toLowerCase() === practiceGuess.trim().toLowerCase() ? 'correct' : 'missed'}`}>
              {nextStep.type.toLowerCase() === practiceGuess.trim().toLowerCase()
                ? 'Prediction matches the next operation.'
                : `Next operation is ${nextStep.type}.`}
            </div>
          )}
          <button className="mini-action" type="button" onClick={() => setPracticeReveal((value) => !value)}>
            {practiceReveal ? 'Hide answer' : 'Reveal next-step hint'}
          </button>
          {practiceReveal && <div className="quiz-card">Hint: {steps[stepIndex + 1]?.description ?? 'You are at the final step.'}</div>}
          <div className="visual-legend">
            <span className="red" /> active <span className="green" /> completed/visited <span className="blue" /> normal
          </div>
        </section>
      )}
      {learningTab === 'Code' && (
        <section className="guide-panel">
          <h2>Code Walkthrough</h2>
          <pre className="code-lines">
            {codeView.lines.map((line, index) => (
              <span className={index === codeView.activeIndex ? 'active-line' : ''} key={`${index}-${line}`}>
                {line || ' '}
              </span>
            ))}
          </pre>
          <p>Read the pseudocode first, then map each animation step to the corresponding code line.</p>
        </section>
      )}
      {learningTab === 'Quiz' && (
        <section className="guide-panel">
          <h2>Quiz</h2>
          <div className="quiz-score">
            Score {quizScore.correct} / {quizScore.total}
          </div>
          {guide.quiz.map((item) => (
            <details className="quiz-card" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
              <button type="button" onClick={() => setQuizScore((score) => ({ correct: score.correct + 1, total: score.total + 1 }))}>
                I knew this
              </button>
              <button type="button" onClick={() => setQuizScore((score) => ({ ...score, total: score.total + 1 }))}>
                Review later
              </button>
            </details>
          ))}
          <h3>Interview prompts</h3>
          <ul>
            {guide.interview.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      {learningTab === 'Experiments' && (
        <section className="guide-panel">
          <h2>Experiments</h2>
          <p>Run best, average, and worst inputs. Compare step count, comparisons, writes, and memory behavior.</p>
          {hugeRunWarning && <div className="run-disabled-reason">{hugeRunWarning}</div>}
          <div className="quiz-card">
            Spaced repetition:{' '}
            {completed.includes(activeModule.id)
              ? `Review due ${reviewDueDate ? new Date(reviewDueDate).toLocaleDateString() : 'tomorrow'} to lock it in.`
              : 'Mark complete after you can explain the final step without hints.'}
          </div>
          <h3>Explain current step simply</h3>
          <p>
            {currentStep
              ? `This step ${currentStep.type}s because ${currentStep.reason?.toLowerCase() ?? 'the algorithm is moving forward.'}`
              : 'Run the algorithm to see a simple step explanation.'}
          </p>
          <h3>Explain technically</h3>
          <p>
            {currentStep
              ? `Operation ${currentStep.operationId ?? currentStep.id} maps to pseudocode line ${currentStep.pseudocodeLine ?? '-'} and code line ${currentStep.codeLine ?? '-'}.`
              : 'Technical mapping appears after a run starts.'}
          </p>
          <div className="complexity-curves">
            {['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'].map((label, i) => (
              <span key={label} style={{ height: `${24 + i * 18}%` }}>
                {label}
              </span>
            ))}
          </div>
          <textarea
            value={notes[activeModule.id] ?? ''}
            onChange={(event) => setNotes((value) => ({ ...value, [activeModule.id]: event.target.value }))}
            placeholder="Local notes for this algorithm"
            rows={4}
          />
        </section>
      )}
      <section>
        <h2>
          <Hash size={18} /> Variables
        </h2>
        <pre>{JSON.stringify(currentStep?.highlights.variables ?? { mode: activeModule.visualMode }, null, 2)}</pre>
        {currentStep?.assertion && <div className="quiz-card">Assertion: {currentStep.assertion}</div>}
        <details className="json-inspector">
          <summary>Current step JSON</summary>
          <pre>{JSON.stringify(currentStep ?? {}, null, 2)}</pre>
        </details>
      </section>
      <section>
        <h2>
          <Braces size={18} /> Pseudocode
        </h2>
        <button className="mini-action" type="button" onClick={() => copyText('Pseudocode', activeModule.pseudocode.join('\n'))}>
          Copy pseudocode
        </button>
        <ol>
          {activeModule.pseudocode.map((line, index) => (
            <li className={index === pseudoActiveIndex ? 'active-line' : ''} key={line}>
              {line}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2>Code</h2>
        <button className="mini-action" type="button" onClick={() => copyText('Code', activeModule.code)}>
          Copy code
        </button>
        <pre>{activeModule.code}</pre>
      </section>
      <section>
        <h2>Complexity</h2>
        <div className="complexity-grid">
          {Object.entries(activeModule.complexity).map(([key, value]) => (
            <span key={key}>
              <strong>{key}</strong>
              {value}
            </span>
          ))}
        </div>
      </section>
      <section>
        <h2>Learning</h2>
        <p>{recommendation}</p>
        <div className="progress-pill">{completed.includes(activeModule.id) ? 'Completed locally' : 'Not completed yet'}</div>
        <div className="quiz-card">
          Quiz: {guide.quiz[0]?.q} Answer: {guide.quiz[0]?.a}
        </div>
        <div className="quiz-card">Common mistake: {guide.misconceptions[0]}</div>
        <div className="quiz-card">Interview prompt: {guide.interview[0]}</div>
        <details className="quiz-card">
          <summary>Metric rules</summary>
          <ul>
            {metricRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </details>
        <details className="quiz-card">
          <summary>Glossary</summary>
          <p>
            <strong>stable</strong>: equal values keep their relative order.
          </p>
          <p>
            <strong>in-place</strong>: uses only small auxiliary memory.
          </p>
          <p>
            <strong>frontier</strong>: nodes waiting to be explored.
          </p>
          <p>
            <strong>pivot</strong>: value used to split a partition.
          </p>
          <p>
            <strong>heapify</strong>: restore heap order under a node.
          </p>
        </details>
      </section>
    </aside>
  )
}
