import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MonthView from './components/MonthView'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import GoogleCalendarLoginModal from './components/GoogleCalendarLoginModal'
import SettingsModal from './components/SettingsModal'
import FloatingDaySidebar from './components/FloatingDaySidebar'
import NotificationToast from './components/NotificationToast'
import RecurringDeleteModal from './components/RecurringDeleteModal'
import RecurringEditModal from './components/RecurringEditModal'
import { EVENTS, fromDateStr, isSameDay } from './data/events'
import NewEventPopover from './components/NewEventPopover'
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
  buildGoogleCalendarDeleteFromRendererEvent,
  buildGoogleCalendarSavePlan,
  isGoogleBackedCalendarEvent,
  isRecurringGoogleCalendarEvent,
  type GoogleCalendarDeleteScope,
  type GoogleCalendarSaveScope
} from './lib/googleCalendarWriteback'
import {
  buildGoogleCalendarCreateInput,
  buildLocalEventsFromDraft,
  type CreateCalendarEventDraft
} from './lib/googleCalendarCreate'
import { filterVisibleCalendarEvents } from './lib/calendarVisibility'
import {
  getCalendarKeyboardAction,
  getNavigatedDate,
  getTodayAnchorDate,
  matchesShortcut,
  type ShortcutKeys
} from './lib/calendarKeyboard'
import {
  loadSidebarSettings,
  saveSidebarSettings,
  type SidebarSettings
} from './lib/sidebarSettings'
import { getToday, useToday } from './lib/today'
import {
  buildTimedDraftFromSelection,
  type NewEventDraftDefaults,
  type TimedSelectionRange
} from './lib/calendarDrag'
import type { PopoverAnchor } from './lib/eventPopoverAnchor'

const DEFAULT_EVENTS = EVENTS.map((event) => ({ ...event }))

interface AppProps {
  windowMode?: 'main' | 'panel'
}

function App({ windowMode = 'main' }: AppProps): React.JSX.Element {
  const today = useToday()
  const [view, setView] = useState<ViewType>('week')
  const [currentDate, setCurrentDate] = useState<Date>(() => getToday())
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    DEFAULT_EVENTS.map((event) => ({ ...event }))
  )
  const [calendarOptions, setCalendarOptions] = useState<RendererCalendar[]>(
    DEFAULT_RENDERER_CALENDARS
  )
  const [googleCalendarStatus, setGoogleCalendarStatus] =
    useState<GoogleCalendarConnectionStatus | null>(null)
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarSummary[]>([])
  const [isGoogleLoginDismissed, setIsGoogleLoginDismissed] = useState(false)
  const [isGoogleConnectPending, setIsGoogleConnectPending] = useState(false)
  const [googleCalendarError, setGoogleCalendarError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [shortcutError, setShortcutError] = useState<string | null>(null)
  const [hiddenCalendars, setHiddenCalendars] = useState<Set<string>>(new Set())
  const [sidebarSettings, setSidebarSettings] = useState<SidebarSettings>(() =>
    loadSidebarSettings(getSidebarSettingsStorage())
  )
  const [copiedEvent, setCopiedEvent] = useState<CalendarEvent | null>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [newEventKey, setNewEventKey] = useState(0)
  const [newEventDefaults, setNewEventDefaults] = useState<NewEventDraftDefaults | undefined>(
    undefined
  )
  const [newEventAnchor, setNewEventAnchor] = useState<PopoverAnchor | undefined>(undefined)
  const [newEventPinnedRange, setNewEventPinnedRange] = useState<{
    date: Date
    startMinutes: number
    endMinutes: number
  } | undefined>(undefined)
  const [pendingRecurringSave, setPendingRecurringSave] = useState<{
    previousEvent: CalendarEvent
    updatedEvent: CalendarEvent
  } | null>(null)
  const [pendingRecurringSaveBusyScope, setPendingRecurringSaveBusyScope] =
    useState<GoogleCalendarSaveScope | null>(null)
  const [pendingRecurringDeleteEvent, setPendingRecurringDeleteEvent] =
    useState<CalendarEvent | null>(null)
  const [pendingRecurringDeleteBusyScope, setPendingRecurringDeleteBusyScope] =
    useState<GoogleCalendarDeleteScope | null>(null)
  const [sidebarShortcut, setSidebarShortcut] = useState<ShortcutKeys | null>(null)
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
    if (!notificationMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationMessage(null)
    }, 2000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notificationMessage])

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

        await syncGoogleCalendarDataEffect(currentDate)
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
    setCurrentDate((activeDate) => getNavigatedDate(activeDate, view, dir))
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (showSettings) {
        return
      }

      if (matchesShortcut(event, sidebarSettings.toggleShortcut)) {
        event.preventDefault()
        setSidebarSettings((currentSettings) => {
          const nextSettings = {
            ...currentSettings,
            sidebarVisible: !currentSettings.sidebarVisible
          }

          saveSidebarSettings(getSidebarSettingsStorage(), nextSettings)
          return nextSettings
        })
        return
      }

      const action = getCalendarKeyboardAction(event)

      if (!action) {
        return
      }

      event.preventDefault()

      if (action.type === 'navigate') {
        setCurrentDate((activeDate) => getNavigatedDate(activeDate, view, action.direction))
        return
      }

      if (action.type === 'set-view') {
        setView(action.view)
        return
      }

      setCurrentDate(getTodayAnchorDate(today))
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showSettings, sidebarSettings.toggleShortcut, today, view])

  useEffect(() => {
    if (windowMode === 'panel') {
      return
    }

    let cancelled = false

    const loadFloatingSidebarShortcut = async (): Promise<void> => {
      try {
        const shortcutState = await window.api.shortcuts.getFloatingSidebarShortcut()

        if (!cancelled) {
          setSidebarShortcut(shortcutState.shortcut)
          setShortcutError(shortcutState.errorMessage)
        }
      } catch (error) {
        if (!cancelled) {
          setShortcutError(
            error instanceof Error ? error.message : 'Unable to load global shortcut'
          )
        }
      }
    }

    void loadFloatingSidebarShortcut()

    return () => {
      cancelled = true
    }
  }, [windowMode])

  const handleDateSelect = (d: Date): void => {
    setCurrentDate(d)
    if (view !== 'day') setView('day')
  }

  const handleEventChange = async (
    updatedEvent: CalendarEvent,
    scope?: GoogleCalendarSaveScope
  ): Promise<void> => {
    const previousEvent = events.find((event) => event.id === updatedEvent.id)

    if (!previousEvent) {
      return
    }

    if (
      scope === undefined &&
      isRecurringGoogleCalendarEvent(previousEvent) &&
      isGoogleBackedCalendarEvent(updatedEvent) &&
      updatedEvent.source.recurrenceDirty !== true
    ) {
      setPendingRecurringSaveBusyScope(null)
      setPendingRecurringSave({ previousEvent, updatedEvent })
      return
    }

    setCurrentDate(fromDateStr(updatedEvent.date))

    setEvents((currentEvents) =>
      sortCalendarEvents(replaceChangedEvents(currentEvents, previousEvent, updatedEvent, scope))
    )

    if (!isGoogleBackedCalendarEvent(updatedEvent) || !isGoogleBackedCalendarEvent(previousEvent)) {
      return
    }

    try {
      const savePlan = buildGoogleCalendarSavePlan(previousEvent, updatedEvent, scope)

      if (!savePlan) {
        return
      }

      await window.api.googleCalendar.updateEvent(savePlan.update)

      if (savePlan.move) {
        await window.api.googleCalendar.moveEvent(savePlan.move)
      }

      await syncGoogleCalendarData(fromDateStr(updatedEvent.date))
      setGoogleCalendarError(null)
    } catch (error) {
      setEvents((currentEvents) =>
        sortCalendarEvents(replaceChangedEvents(currentEvents, updatedEvent, previousEvent, scope))
      )

      setGoogleCalendarError(getGoogleCalendarErrorMessage(error))
      console.error(error)
    } finally {
      setPendingRecurringSaveBusyScope(null)
      setPendingRecurringSave((currentSave) =>
        currentSave?.updatedEvent.id === updatedEvent.id ? null : currentSave
      )
    }
  }

  const handleEventDelete = async (
    eventToDelete: CalendarEvent,
    scope?: GoogleCalendarDeleteScope
  ): Promise<void> => {
    if (scope === undefined && isRecurringGoogleCalendarEvent(eventToDelete)) {
      setPendingRecurringDeleteBusyScope(null)
      setPendingRecurringDeleteEvent(eventToDelete)
      return
    }

    const previousEvents = events

    setEvents((currentEvents) =>
      sortCalendarEvents(removeDeletedEvents(currentEvents, eventToDelete, scope))
    )

    const googleDelete = buildGoogleCalendarDeleteFromRendererEvent(eventToDelete, scope)

    if (!googleDelete) {
      return
    }

    try {
      await window.api.googleCalendar.deleteEvent(googleDelete)
      if (isRecurringGoogleCalendarEvent(eventToDelete)) {
        await syncGoogleCalendarData(fromDateStr(eventToDelete.date))
      }
      setGoogleCalendarError(null)
    } catch (error) {
      setEvents(previousEvents)
      setGoogleCalendarError(getGoogleCalendarErrorMessage(error))
      console.error(error)
      throw error
    } finally {
      setPendingRecurringDeleteBusyScope(null)
      setPendingRecurringDeleteEvent((currentEvent) =>
        currentEvent?.id === eventToDelete.id ? null : currentEvent
      )
    }
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
        throw error instanceof Error ? error : new Error('Google Calendar event creation failed')
      }
    }

    setEvents((currentEvents) =>
      sortCalendarEvents([...currentEvents, ...buildLocalEventsFromDraft(draft)])
    )
  }

  const handleCopyEvent = (event: CalendarEvent): void => {
    setCopiedEvent(cloneCalendarEvent(event))
    setNotificationMessage('You copied an event')
  }

  const handlePasteEvent = (): void => {
    setNotificationMessage('You pasted an event')
  }

  const handleToggleCalendarVisibility = (name: string): void => {
    setHiddenCalendars((currentHiddenCalendars) => {
      const nextHiddenCalendars = new Set(currentHiddenCalendars)

      if (nextHiddenCalendars.has(name)) {
        nextHiddenCalendars.delete(name)
      } else {
        nextHiddenCalendars.add(name)
      }

      return nextHiddenCalendars
    })
  }

  const updateSidebarSettings = (
    updater: SidebarSettings | ((currentSettings: SidebarSettings) => SidebarSettings)
  ): void => {
    setSidebarSettings((currentSettings) => {
      const nextSettings = typeof updater === 'function' ? updater(currentSettings) : updater

      saveSidebarSettings(getSidebarSettingsStorage(), nextSettings)
      return nextSettings
    })
  }

  const toggleSidebar = (): void => {
    updateSidebarSettings((currentSettings) => ({
      ...currentSettings,
      sidebarVisible: !currentSettings.sidebarVisible
    }))
  }

  const handleSidebarToggleShortcutChange = (toggleShortcut: ShortcutKeys | null): void => {
    updateSidebarSettings((currentSettings) => ({
      ...currentSettings,
      toggleShortcut
    }))
  }

  const openNewEvent = (defaults?: NewEventDraftDefaults, anchor?: PopoverAnchor): void => {
    setNewEventDefaults(defaults)
    setNewEventAnchor(anchor)
    setNewEventKey((value) => value + 1)
    setShowNewEvent(true)
    if (defaults && !defaults.allDay) {
      setNewEventPinnedRange({
        date: defaults.selectedDate,
        startMinutes: parseDraftTime(defaults.startTime),
        endMinutes: parseDraftTime(defaults.endTime)
      })
    } else {
      setNewEventPinnedRange(undefined)
    }
  }

  const handleNewEventTimesChange = (
    startTime: string,
    endTime: string,
    allDay: boolean
  ): void => {
    if (allDay || !newEventDefaults?.selectedDate) {
      setNewEventPinnedRange(undefined)
      return
    }
    setNewEventPinnedRange({
      date: newEventDefaults.selectedDate,
      startMinutes: parseDraftTime(startTime),
      endMinutes: parseDraftTime(endTime)
    })
  }

  const handleNewEventPinnedSelectionChange = (
    date: Date,
    range: TimedSelectionRange
  ): void => {
    const nextDefaults = buildTimedDraftFromSelection(date, range)

    setNewEventPinnedRange({
      date: nextDefaults.selectedDate,
      startMinutes: range.startMinutes,
      endMinutes: range.endMinutes
    })
    setNewEventDefaults((currentDefaults) => ({
      ...(currentDefaults ?? nextDefaults),
      selectedDate: nextDefaults.selectedDate,
      allDay: false,
      startTime: nextDefaults.startTime,
      endTime: nextDefaults.endTime
    }))
  }

  const handleTimedSelectionCreate = (
    date: Date,
    range: TimedSelectionRange,
    anchor: PopoverAnchor
  ): void => {
    openNewEvent(buildTimedDraftFromSelection(date, range), anchor)
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

  const handleSidebarShortcutChange = (shortcut: ShortcutKeys | null): void => {
    void (async () => {
      try {
        const shortcutState = await window.api.shortcuts.setFloatingSidebarShortcut(shortcut)

        setSidebarShortcut(shortcutState.shortcut)
        setShortcutError(shortcutState.errorMessage)
      } catch (error) {
        setShortcutError(
          error instanceof Error ? error.message : 'Unable to update global shortcut'
        )
      }
    })()
  }

  const syncGoogleCalendarData = useCallback(
    async (anchorDate: Date): Promise<void> => {
      const calendarsToLoad =
        googleCalendars.length > 0
          ? googleCalendars
          : await window.api.googleCalendar.listCalendars()
      const syncRange = getGoogleCalendarSyncRange(anchorDate)
      const instanceBatches = await Promise.all(
        calendarsToLoad.map((calendar) =>
          window.api.googleCalendar.listEvents({
            calendarId: calendar.id,
            ...syncRange,
            singleEvents: true
          })
        )
      )
      const recurringSeriesBatches = await Promise.all(
        calendarsToLoad.map((calendar) =>
          window.api.googleCalendar
            .listEvents({
              calendarId: calendar.id,
              ...syncRange,
              singleEvents: false
            })
            .then((events) => events.filter((event) => Boolean(event.recurrence)))
        )
      )
      const presentation = buildGoogleCalendarPresentation(calendarsToLoad, [
        ...instanceBatches.flat(),
        ...recurringSeriesBatches.flat()
      ])

      setGoogleCalendars(calendarsToLoad)
      setCalendarOptions(
        presentation.calendars.length > 0 ? presentation.calendars : DEFAULT_RENDERER_CALENDARS
      )
      setEvents(sortCalendarEvents(presentation.events))
    },
    [googleCalendars]
  )

  const syncGoogleCalendarDataEffect = useEffectEvent(async (anchorDate: Date): Promise<void> => {
    await syncGoogleCalendarData(anchorDate)
  })

  const isGoogleLoginModalOpen =
    googleCalendarStatus !== null &&
    shouldOpenGoogleCalendarLoginModal(googleCalendarStatus, isGoogleLoginDismissed)
  const visibleEvents = filterVisibleCalendarEvents(events, hiddenCalendars)

  if (windowMode === 'panel') {
    return (
      <div className="h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>
        <FloatingDaySidebar
          events={visibleEvents}
          calendars={calendarOptions}
          today={today}
          onClose={() => window.close()}
          onEventChange={handleEventChange}
          onEventDelete={handleEventDelete}
          onCopyEvent={handleCopyEvent}
          onTimedSelectionCreate={handleTimedSelectionCreate}
          newEventOpen={showNewEvent}
          pinnedSelection={newEventPinnedRange}
          onPinnedSelectionChange={handleNewEventPinnedSelectionChange}
        />
        <NewEventPopover
          key={newEventKey}
          open={showNewEvent}
          onClose={() => { setShowNewEvent(false); setNewEventPinnedRange(undefined) }}
          calendars={calendarOptions}
          onCreateEvent={handleCreateEvent}
          onPasteEvent={handlePasteEvent}
          copiedEvent={copiedEvent}
          initialValues={newEventDefaults}
          anchor={newEventAnchor}
          onTimesChange={handleNewEventTimesChange}
        />
      </div>
    )
  }

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
        sidebarToggleShortcut={sidebarSettings.toggleShortcut}
        onSidebarToggleShortcutChange={handleSidebarToggleShortcutChange}
        googleCalendarStatus={googleCalendarStatus}
        isConnectPending={isGoogleConnectPending}
        errorMessage={googleCalendarError}
        onGoogleConnect={handleGoogleCalendarConnect}
        shortcutErrorMessage={shortcutError}
        sidebarShortcut={sidebarShortcut}
        onSidebarShortcutChange={handleSidebarShortcutChange}
      />
      <RecurringDeleteModal
        open={pendingRecurringDeleteEvent !== null}
        onClose={() => setPendingRecurringDeleteEvent(null)}
        busyScope={pendingRecurringDeleteBusyScope}
        onDeleteThisEvent={() => {
          if (pendingRecurringDeleteEvent) {
            setPendingRecurringDeleteBusyScope('instance')
            void handleEventDelete(pendingRecurringDeleteEvent, 'instance')
          }
        }}
        onDeleteAllEvents={() => {
          if (pendingRecurringDeleteEvent) {
            setPendingRecurringDeleteBusyScope('series')
            void handleEventDelete(pendingRecurringDeleteEvent, 'series')
          }
        }}
      />
      <RecurringEditModal
        open={pendingRecurringSave !== null}
        onClose={() => setPendingRecurringSave(null)}
        busyScope={pendingRecurringSaveBusyScope}
        onEditThisEvent={() => {
          if (pendingRecurringSave) {
            setPendingRecurringSaveBusyScope('instance')
            void handleEventChange(pendingRecurringSave.updatedEvent, 'instance')
          }
        }}
        onEditAllEvents={() => {
          if (pendingRecurringSave) {
            setPendingRecurringSaveBusyScope('series')
            void handleEventChange(pendingRecurringSave.updatedEvent, 'series')
          }
        }}
      />
      <NewEventPopover
        key={newEventKey}
        open={showNewEvent}
        onClose={() => { setShowNewEvent(false); setNewEventPinnedRange(undefined) }}
        calendars={calendarOptions}
        onCreateEvent={handleCreateEvent}
        onPasteEvent={handlePasteEvent}
        copiedEvent={copiedEvent}
        initialValues={newEventDefaults}
        anchor={newEventAnchor}
        onTimesChange={handleNewEventTimesChange}
      />
      <NotificationToast message={notificationMessage} />
      <motion.div
        animate={{ width: sidebarSettings.sidebarVisible ? 220 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.9 }}
        initial={false}
        style={{ overflow: 'hidden', flexShrink: 0 }}
      >
        <Sidebar
          calendars={calendarOptions}
          events={visibleEvents}
          hiddenCalendars={hiddenCalendars}
          currentDate={currentDate}
          today={today}
          view={view}
          onDateSelect={handleDateSelect}
          onToggleCalendarVisibility={handleToggleCalendarVisibility}
          onOpenNewEvent={() => openNewEvent()}
        />
      </motion.div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onPrev={() => navigate('prev')}
          onNext={() => navigate('next')}
          sidebarVisible={sidebarSettings.sidebarVisible}
          onSidebarToggle={toggleSidebar}
          onSettingsOpen={() => setShowSettings(true)}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'month' && (
            <MonthView
              events={visibleEvents}
              calendars={calendarOptions}
              currentDate={currentDate}
              today={today}
              onDateSelect={handleDateSelect}
              onEventChange={handleEventChange}
              onEventDelete={handleEventDelete}
              onCopyEvent={handleCopyEvent}
            />
          )}
          {view === 'week' && (
            <WeekView
              events={visibleEvents}
              calendars={calendarOptions}
              currentDate={currentDate}
              today={today}
              onDateSelect={handleDateSelect}
              onEventChange={handleEventChange}
              onEventDelete={handleEventDelete}
              onCopyEvent={handleCopyEvent}
              onTimedSelectionCreate={handleTimedSelectionCreate}
              newEventOpen={showNewEvent}
              pinnedSelection={newEventPinnedRange}
              onPinnedSelectionChange={handleNewEventPinnedSelectionChange}
            />
          )}
          {view === 'day' && (
            <DayView
              events={visibleEvents}
              calendars={calendarOptions}
              currentDate={currentDate}
              today={today}
              onEventChange={handleEventChange}
              onEventDelete={handleEventDelete}
              onCopyEvent={handleCopyEvent}
              onTimedSelectionCreate={handleTimedSelectionCreate}
              newEventOpen={showNewEvent}
              pinnedSelection={newEventPinnedRange}
              onPinnedSelectionChange={handleNewEventPinnedSelectionChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function getSidebarSettingsStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
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

function replaceEventInstances(
  events: CalendarEvent[],
  targetEvent: CalendarEvent,
  replacements: CalendarEvent[]
): CalendarEvent[] {
  return [
    ...events.filter((event) => !isSameEventInstanceGroup(event, targetEvent)),
    ...replacements
  ]
}

function removeEventInstances(
  events: CalendarEvent[],
  targetEvent: CalendarEvent
): CalendarEvent[] {
  return events.filter((event) => !isSameEventInstanceGroup(event, targetEvent))
}

function removeDeletedEvents(
  events: CalendarEvent[],
  targetEvent: CalendarEvent,
  scope?: GoogleCalendarDeleteScope
): CalendarEvent[] {
  if (scope === 'instance') {
    return events.filter((event) => event.id !== targetEvent.id)
  }

  return removeEventInstances(events, targetEvent)
}

function replaceChangedEvents(
  events: CalendarEvent[],
  targetEvent: CalendarEvent,
  replacementEvent: CalendarEvent,
  scope?: GoogleCalendarSaveScope
): CalendarEvent[] {
  if (scope === 'instance') {
    return [...events.filter((event) => event.id !== targetEvent.id), replacementEvent]
  }

  return replaceEventInstances(events, targetEvent, [replacementEvent])
}

function isSameEventInstanceGroup(left: CalendarEvent, right: CalendarEvent): boolean {
  if (left.source?.provider === 'google' && right.source?.provider === 'google') {
    return (
      left.source.calendarId === right.source.calendarId &&
      left.source.eventId === right.source.eventId
    )
  }

  return left.id === right.id
}

function parseDraftTime(draftTime: string): number {
  const [time, meridiem] = draftTime.split(' ')
  const [hourText, minuteText] = (time ?? '').split(':')
  const hour = Number(hourText) || 0
  const minute = Number(minuteText) || 0
  if (meridiem === 'AM') return (hour % 12) * 60 + minute
  return ((hour % 12) + 12) * 60 + minute
}

function cloneCalendarEvent(event: CalendarEvent): CalendarEvent {
  return {
    ...event,
    ...(event.source ? { source: { ...event.source } } : {})
  }
}

export default App
