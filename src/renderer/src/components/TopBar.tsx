import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { getWeekStart } from '../data/events'

export type ViewType = 'day' | 'week' | 'month'

const VIEWS: ViewType[] = ['day', 'week', 'month']

function getTitle(view: ViewType, date: Date): string {
  if (view === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  if (view === 'week') {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (start.getMonth() === end.getMonth()) {
      return `${startStr} – ${end.getDate()}, ${end.getFullYear()}`
    }
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startStr} – ${endStr}, ${end.getFullYear()}`
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

interface TopBarProps {
  view: ViewType
  onViewChange: (v: ViewType) => void
  currentDate: Date
  onPrev: () => void
  onNext: () => void
}

export default function TopBar({
  view,
  onViewChange,
  currentDate,
  onPrev,
  onNext
}: TopBarProps): React.JSX.Element {
  return (
    <div
      className="drag-region flex items-center gap-2 px-4 shrink-0"
      style={{
        height: 'var(--topbar-h)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)'
      }}
    >
      {/* Navigation */}
      <div className="no-drag flex items-center gap-1">
        <button
          onClick={onPrev}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <CaretLeft size={14} weight="bold" />
        </button>
        <button
          onClick={onNext}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* Title */}
      <span className="text-sm font-semibold tracking-tight ml-1" style={{ color: 'var(--text)' }}>
        {getTitle(view, currentDate)}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View switcher */}
      <div className="no-drag flex items-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className="h-7 rounded-md text-xs font-medium capitalize transition-all duration-100"
            style={
              view === v
                ? {
                    background: 'var(--surface-3)',
                    color: 'var(--text)',
                    paddingLeft: '1.25rem',
                    paddingRight: '1.25rem'
                  }
                : { color: 'var(--text-muted)', paddingLeft: '0.75rem', paddingRight: '0.75rem' }
            }
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
