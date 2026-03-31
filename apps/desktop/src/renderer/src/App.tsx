import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MonthView from './components/MonthView'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import GoogleCalendarLoginModal from './components/GoogleCalendarLoginModal'
import SettingsModal from './components/SettingsModal'
import NewEventPopover from './components/NewEventPopover'
import { EVENTS, isSameDay } from './data/events'
import type { CalendarEvent } from './data/events'
import type { ViewType } from './components/TopBar'
import type {
  GoogleCalendarConnectionStatus,
  GoogleCalendarSummary
} from '../../main/googleCalendar/types'
import {
  getGoogleCalendarErrorMessage,
  shouldOpenGoogleCalendarLoginModal
} from './lib/googleCalendarConnection'
import {
  buildGoogleCalendarPresentation,
  DEFAULT_RENDERER_CALENDARS,
  getGoogleCalendarSyncRange,
  type RendererCalendar
} from './lib/googleCalendarSync'
import {
  buildGoogleCalendarUpdateFromRendererEvent,
  isGoogleBackedCalendarEvent
} from './lib/googleCalendarWriteback'
import {
  buildGoogleCalendarCreateInput,
  buildLocalEventsFromDraft,
  type CreateCalendarEventDraft
} from './lib/googleCalendarCreate'
import { getToday, useToday } from './lib/today'
import {
  buildTimedDraftFromSelection,
  type NewEventDraftDefaults,
  type TimedSelectionRange
} from './lib/calendarDrag'

const DEFAULT_EVENTS = EVENTS.map((event) => ({ ...event }))

function App(): React.JSX.Element {
  const today = useToday()
  const [view, setView] = useState<ViewType>('week')
  const [currentDate, setCurrentDate] = useState<Date>(() => getToday())
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    DEFAULT_EVENTS.map((event) => ({ ...event }))
  )
  const [calendarOptions, setCalendarOptions] =
    useState<RendererCalendar[]>(DEFAULT_RENDERER_CALENDARS)
  const [googleCalendarStatus, setGoogleCalendarStatus] =
    useState<GoogleCalendarConnectionStatus | null>(null)
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarSummary[]>([])
  const [isGoogleLoginDismissed, setIsGoogleLoginDismissed] = useState(false)
  const [isGoogleConnectPending, setIsGoogleConnectPending] = useState(false)
  const [googleCalendarError, setGoogleCalendarError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [newEventKey, setNewEventKey] = useState(0)
  const [newEventDefaults, setNewEventDefaults] = useState<NewEventDraftDefaults | undefined>(
    undefined
  )
  const previousTodayRef = useRef(today)

  useEffect(() => {
    let cancelled = false

    const loadGoogleCalendarStatus = async (): Promise<void> => {
      try {
        const status = await window.api.googleCalendar.getStatus()

        if (!cancelled) {
          setGoogleCalendarStatus(status)
          setGoogleCalendarError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setGoogleCalendarStatus({
            configured: true,
            connected: false,
            hasRefreshToken: false
          })
          setGoogleCalendarError(getGoogleCalendarErrorMessage(error))
        }
      }
    }

    void loadGoogleCalendarStatus()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (googleCalendarStatus?.connected) {
      return
    }

    setGoogleCalendars([])
    setCalendarOptions(DEFAULT_RENDERER_CALENDARS)
    setEvents(DEFAULT_EVENTS.map((event) => ({ ...event })))
  }, [googleCalendarStatus?.connected])

  useEffect(() => {
    const previousToday = previousTodayRef.current
    previousTodayRef.current = today

    if (isSameDay(previousToday, today)) {
      return
    }

    setCurrentDate((activeDate) =>
      isSameDay(activeDate, previousToday) ? new Date(today) : activeDate
    )
  }, [today])

  useEffect(() => {
    if (!googleCalendarStatus?.connected) {
      return
    }

    let cancelled = false

    const syncGoogleCalendarEvents = async (): Promise<void> => {
      try {
        if (cancelled) {
          return
        }

        await syncGoogleCalendarData(currentDate)
      } catch (error) {
        if (!cancelled) {
          setGoogleCalendarError(getGoogleCalendarErrorMessage(error))
        }
      }
    }

    void syncGoogleCalendarEvents()

    return () => {
      cancelled = true
    }
  }, [currentDate, googleCalendarStatus?.connected])

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
    const previousEvent = events.find((event) => event.id === updatedEvent.id)

    setEvents((currentEvents) =>
      sortCalendarEvents(
        currentEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
      )
    )

    const googleUpdate = buildGoogleCalendarUpdateFromRendererEvent(updatedEvent)

    if (!googleUpdate || !isGoogleBackedCalendarEvent(updatedEvent)) {
      return
    }

    void (async () => {
      try {
        const remoteEvent = await window.api.googleCalendar.updateEvent(googleUpdate)
        const mappedEvent = buildGoogleCalendarPresentation(googleCalendars, [remoteEvent]).events[0]

        if (!mappedEvent) {
          return
        }

        setEvents((currentEvents) =>
          sortCalendarEvents(
            currentEvents.map((event) => (event.id === updatedEvent.id ? mappedEvent : event))
          )
        )
      } catch (error) {
        if (previousEvent) {
          setEvents((currentEvents) =>
            sortCalendarEvents(
              currentEvents.map((event) =>
                event.id === previousEvent.id ? previousEvent : event
              )
            )
          )
        }

        setGoogleCalendarError(getGoogleCalendarErrorMessage(error))
        console.error(error)
      }
    })()
  }

  const handleCreateEvent = async (draft: CreateCalendarEventDraft): Promise<void> => {
    setCurrentDate(new Date(draft.selectedDate))

    if (googleCalendarStatus?.connected && !draft.calendarId.startsWith('default:')) {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

      try {
        await window.api.googleCalendar.createEvent(buildGoogleCalendarCreateInput(draft, timeZone))
        await syncGoogleCalendarData(draft.selectedDate)
        setGoogleCalendarError(null)
        return
      } catch (error) {
        setGoogleCalendarError(getGoogleCalendarErrorMessage(error))
        throw error instanceof Error
          ? error
          : new Error('Google Calendar event creation failed')
      }
    }

    setEvents((currentEvents) =>
      sortCalendarEvents([...currentEvents, ...buildLocalEventsFromDraft(draft)])
    )
  }

  const openNewEvent = (defaults?: NewEventDraftDefaults): void => {
    setNewEventDefaults(defaults)
    setNewEventKey((value) => value + 1)
    setShowNewEvent(true)
  }

  const handleTimedSelectionCreate = (date: Date, range: TimedSelectionRange): void => {
    openNewEvent(buildTimedDraftFromSelection(date, range))
  }

  const handleGoogleCalendarConnect = async (): Promise<void> => {
    setIsGoogleConnectPending(true)
    setGoogleCalendarError(null)

    try {
      const status = await window.api.googleCalendar.connect()
      setGoogleCalendarStatus(status)
      setIsGoogleLoginDismissed(false)
    } catch (error) {
      setGoogleCalendarError(getGoogleCalendarErrorMessage(error))
    } finally {
      setIsGoogleConnectPending(false)
    }
  }

  async function syncGoogleCalendarData(anchorDate: Date): Promise<void> {
    const calendarsToLoad =
      googleCalendars.length > 0 ? googleCalendars : await window.api.googleCalendar.listCalendars()
    const syncRange = getGoogleCalendarSyncRange(anchorDate)
    const eventBatches = await Promise.all(
      calendarsToLoad.map((calendar) =>
        window.api.googleCalendar.listEvents({
          calendarId: calendar.id,
          ...syncRange,
          singleEvents: true
        })
      )
    )
    const presentation = buildGoogleCalendarPresentation(calendarsToLoad, eventBatches.flat())

    setGoogleCalendars(calendarsToLoad)
    setCalendarOptions(
      presentation.calendars.length > 0 ? presentation.calendars : DEFAULT_RENDERER_CALENDARS
    )
    setEvents(sortCalendarEvents(presentation.events))
  }

  const isGoogleLoginModalOpen =
    googleCalendarStatus !== null &&
    shouldOpenGoogleCalendarLoginModal(googleCalendarStatus, isGoogleLoginDismissed)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <GoogleCalendarLoginModal
        open={isGoogleLoginModalOpen}
        onClose={() => setIsGoogleLoginDismissed(true)}
        onConnect={handleGoogleCalendarConnect}
        isBusy={isGoogleConnectPending}
        errorMessage={googleCalendarError}
      />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        googleCalendarStatus={googleCalendarStatus}
        isConnectPending={isGoogleConnectPending}
        errorMessage={googleCalendarError}
        onGoogleConnect={handleGoogleCalendarConnect}
      />
      <NewEventPopover
        key={newEventKey}
        open={showNewEvent}
        onClose={() => setShowNewEvent(false)}
        calendars={calendarOptions}
        onCreateEvent={handleCreateEvent}
        initialValues={newEventDefaults}
      />
      <Sidebar
        calendars={calendarOptions}
        events={events}
        currentDate={currentDate}
        today={today}
        view={view}
        onDateSelect={handleDateSelect}
        onOpenNewEvent={() => openNewEvent()}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onPrev={() => navigate('prev')}
          onNext={() => navigate('next')}
          onSettingsOpen={() => setShowSettings(true)}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'month' && (
            <MonthView
              events={events}
              currentDate={currentDate}
              today={today}
              onDateSelect={handleDateSelect}
            />
          )}
          {view === 'week' && (
            <WeekView
              events={events}
              currentDate={currentDate}
              today={today}
              onDateSelect={handleDateSelect}
              onEventChange={handleEventChange}
              onTimedSelectionCreate={handleTimedSelectionCreate}
            />
          )}
          {view === 'day' && (
            <DayView
              events={events}
              currentDate={currentDate}
              today={today}
              onEventChange={handleEventChange}
              onTimedSelectionCreate={handleTimedSelectionCreate}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((left, right) => {
    const dateComparison = left.date.localeCompare(right.date)

    if (dateComparison !== 0) {
      return dateComparison
    }

    if (Boolean(left.allDay) !== Boolean(right.allDay)) {
      return left.allDay ? -1 : 1
    }

    const startComparison = (left.startTime ?? '').localeCompare(right.startTime ?? '')

    if (startComparison !== 0) {
      return startComparison
    }

    return left.title.localeCompare(right.title)
  })
}

export default App
