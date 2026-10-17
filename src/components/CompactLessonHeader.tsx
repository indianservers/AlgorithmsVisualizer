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
  return (
    <header className="compact-lesson-header">
      <Link className="compact-back" to={backTo} aria-label="Back to learning overview" title="Back to learning overview">
        <ArrowLeft size={17} />
      </Link>
      <h1 title={title}>{title}</h1>
      <p title={description}>{description}</p>
      <div className="compact-lesson-actions">
        <button
          type="button"
          onClick={onStudy}
          aria-label={studied ? 'Studied — undo' : 'Mark as studied'}
          title={studied ? 'Studied — click to undo' : 'Mark as studied'}
          aria-pressed={studied}
        >
          {studied ? <Check size={16} /> : <Bookmark size={16} />}
          <span>{studied ? 'Studied' : 'Mark studied'}</span>
        </button>
        {account}
      </div>
    </header>
  )
}
