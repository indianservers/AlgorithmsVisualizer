// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { useLocation, useNavigate } from 'react-router-dom'
import { algorithmPath, resolveRouteState } from '../utils/routing'
import { InputAccessButton } from './InputAccessButton'
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
  useLocaleRender()

  const location = useLocation(),
    navigate = useNavigate()
  const openTab = (tab: LearningTab) => {
    if (tab === 'Learn') {
      const parts = location.pathname.split('/').filter(Boolean)
      const { activeModule } = resolveRouteState(parts[0], parts[1])
      navigate(algorithmPath(activeModule) + '/learn')
    } else onChange(tab)
  }
  return (
    <div className="lesson-navigation">
      <nav className="lesson-tabs" aria-label={tx('Algorithm sections', 'navigation')}>
        {tx(
          tabs.map((tab) => (
            <button type="button" key={tab} aria-pressed={active === tab} onClick={() => openTab(tab)}>
              {tx(icons?.[tab], 'navigation')}
              {tx(tab, 'navigation')}
            </button>
          )),
          'navigation',
        )}
      </nav>
      <InputAccessButton onOpen={() => onChange('Visualization')} />
    </div>
  )
}
