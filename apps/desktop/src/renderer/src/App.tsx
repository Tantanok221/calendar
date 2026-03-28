import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MonthView from './components/MonthView'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import { EVENTS } from './data/events'
import type { CalendarEvent } from './data/events'
import type { ViewType } from './components/TopBar'

const TODAY = new Date(2026, 2, 28) // March 28, 2026

function App(): React.JSX.Element {
  const [view, setView] = useState<ViewType>('week')
  const [currentDate, setCurrentDate] = useState<Date>(new Date(TODAY))
  const [events, setEvents] = useState<CalendarEvent[]>(() => EVENTS.map((event) => ({ ...event })))

  const navigate = (dir: 'prev' | 'next'): void => {
    const d = new Date(currentDate)
    const n = dir === 'next' ? 1 : -1
    if (view === 'day') d.setDate(d.getDate() + n)
    else if (view === 'week') d.setDate(d.getDate() + n * 7)
    else d.setMonth(d.getMonth() + n)
    setCurrentDate(d)
  }

  const handleDateSelect = (d: Date): void => {
    setCurrentDate(d)
    if (view !== 'day') setView('day')
  }

  const handleEventChange = (updatedEvent: CalendarEvent): void => {
    setEvents((currentEvents) =>
      currentEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        events={events}
        currentDate={currentDate}
        today={TODAY}
        view={view}
        onDateSelect={handleDateSelect}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onPrev={() => navigate('prev')}
          onNext={() => navigate('next')}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'month' && (
            <MonthView
              events={events}
              currentDate={currentDate}
              today={TODAY}
              onDateSelect={handleDateSelect}
            />
          )}
          {view === 'week' && (
            <WeekView
              events={events}
              currentDate={currentDate}
              today={TODAY}
              onDateSelect={handleDateSelect}
              onEventChange={handleEventChange}
            />
          )}
          {view === 'day' && (
            <DayView
              events={events}
              currentDate={currentDate}
              today={TODAY}
              onEventChange={handleEventChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
