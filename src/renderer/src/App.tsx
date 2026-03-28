import { useState } from 'react'
import {
  buildMonthGrid,
  formatLongDate,
  formatMonthLabel,
  shiftMonth,
  WEEKDAY_LABELS
} from './lib/calendar'

function App(): React.JSX.Element {
  const today = new Date()
  const locale = navigator.language
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1, 12)
  )
  const days = buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth(), today)
  const daysInMonth = days.filter((day) => day.currentMonth).length
  const weekendDays = days.filter((day) => day.currentMonth && day.weekend).length
  const monthLabel = formatMonthLabel(visibleMonth, locale)
  const todayLabel = formatLongDate(today, locale)

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Calendar for Desktop</p>
        <h1>Plan the month in a calm, native-feeling workspace.</h1>
        <p className="lede">
          Electron now handles the shell, React drives the UI, TypeScript keeps the model strict,
          and Bun manages installs, scripts, and tests.
        </p>

        <div className="today-card">
          <span className="today-chip">Today</span>
          <strong>{todayLabel}</strong>
          <p>Initial shell ready for scheduling, events, and macOS packaging.</p>
        </div>

        <dl className="stats-grid">
          <div>
            <dt>Visible days</dt>
            <dd>{daysInMonth}</dd>
          </div>
          <div>
            <dt>Weekend days</dt>
            <dd>{weekendDays}</dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>Electron + React</dd>
          </div>
          <div>
            <dt>Tooling</dt>
            <dd>TypeScript + Bun</dd>
          </div>
        </dl>
      </section>

      <section className="calendar-panel">
        <header className="calendar-toolbar">
          <div>
            <p className="eyebrow">Month view</p>
            <h2>{monthLabel}</h2>
          </div>

          <div className="toolbar-actions">
            <button type="button" onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}>
              Prev
            </button>
            <button
              type="button"
              className="primary"
              onClick={() =>
                setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12))
              }
            >
              Today
            </button>
            <button type="button" onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}>
              Next
            </button>
          </div>
        </header>

        <div className="weekday-row">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day) => (
            <article
              key={day.key}
              className={[
                'day-card',
                day.currentMonth ? 'is-current-month' : 'is-adjacent-month',
                day.isToday ? 'is-today' : '',
                day.weekend ? 'is-weekend' : ''
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="day-number">{day.dayOfMonth}</span>
              <span className="day-meta">
                {day.isToday ? 'Today' : day.weekend ? 'Weekend' : ''}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
