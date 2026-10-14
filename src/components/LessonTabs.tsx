import type { LearningTab } from '../types'

export function LessonTabs({
  active,
  onChange,
  tabs = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
}: {
  active: LearningTab
  onChange: (tab: LearningTab) => void
  tabs?: LearningTab[]
}) {
  return (
    <nav className="lesson-tabs" aria-label="Algorithm sections">
      {tabs.map((tab) => (
        <button type="button" key={tab} aria-pressed={active === tab} onClick={() => onChange(tab)}>
          {tab}
        </button>
      ))}
    </nav>
  )
}
