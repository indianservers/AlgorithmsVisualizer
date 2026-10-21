// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { ArrowLeft, Check, Bookmark } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function CompactLessonHeader({
  title,
  description,
  studied,
  onStudy,
  account,
  backTo = '/daa/syllabus-dashboard',
}: {
  title: string
  description: string
  studied: boolean
  onStudy: () => void
  account?: ReactNode
  backTo?: string
}) {
  useLocaleRender()

  return (
    <header className="compact-lesson-header">
      <Link className="compact-back" to={backTo} aria-label={tx('Back to learning overview', 'common')} title={tx('Back to learning overview', 'common')}>
        <ArrowLeft size={17} />
      </Link>
      <h1 title={tx(title, 'common')}>{tx(title, 'common')}</h1>
      <p title={tx(description, 'common')}>{tx(description, 'common')}</p>
      <div className="compact-lesson-actions">
        <button
          type="button"
          onClick={onStudy}
          aria-label={tx(studied ? 'Studied — undo' : 'Mark as studied', 'common')}
          title={tx(studied ? 'Studied — click to undo' : 'Mark as studied', 'common')}
          aria-pressed={studied}
        >
          {tx(studied ? <Check size={16} /> : <Bookmark size={16} />, 'common')}
          <span>{tx(studied ? 'Studied' : 'Mark studied', 'common')}</span>
        </button>
        {tx(account, 'common')}
      </div>
    </header>
  )
}
