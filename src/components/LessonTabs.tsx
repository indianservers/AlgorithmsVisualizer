import type { ReactNode } from 'react'
import type { LearningTab } from '../types'

export function LessonTabs({
  active,
  icons,
  onChange,
  tabs = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
}: {
  icons?: Partial<Record<LearningTab, ReactNode>>
  active: LearningTab
  onChange: (tab: LearningTab) => void
  tabs?: LearningTab[]
}) {
  return (
    <nav className="lesson-tabs" aria-label="Algorithm sections">
      {tabs.map((tab) => (
        <button type="button" key={tab} aria-pressed={active === tab} onClick={() => onChange(tab)}>
          {icons?.[tab]}
          {tab}
        </button>
      ))}
    </nav>
  )
}
