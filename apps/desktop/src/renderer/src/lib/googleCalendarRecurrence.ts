export type RepeatEndType = 'date' | 'count'

export interface GoogleCalendarRepeatDraft {
  selectedDate: Date
  repeat: boolean
  repeatDays: number[]
  repeatEndType: RepeatEndType
  repeatUntil: Date
  repeatCount: number
}

export interface ParsedGoogleCalendarRecurrence {
  repeat: boolean
  repeatDays: number[]
  repeatEndType: RepeatEndType
  repeatUntil: Date
  repeatCount: number
}

const RRULE_BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_CODE_TO_INDEX = new Map(RRULE_BYDAY.map((code, index) => [code, index]))

export function buildGoogleCalendarRecurrenceRule(
  draft: GoogleCalendarRepeatDraft
): string[] | undefined {
  if (!draft.repeat) {
    return undefined
  }

  const byDay = getRepeatDayCodes(draft).join(',')
  const parts = ['RRULE:FREQ=WEEKLY', `BYDAY=${byDay}`]

  if (draft.repeatEndType === 'count') {
    parts.push(`COUNT=${Math.max(1, draft.repeatCount)}`)
  } else {
    parts.push(`UNTIL=${formatUntilDate(draft.repeatUntil)}`)
  }

  return [parts.join(';')]
}

export function buildGoogleCalendarUpdateRecurrence(draft: GoogleCalendarRepeatDraft): string[] {
  return buildGoogleCalendarRecurrenceRule(draft) ?? []
}

export function parseGoogleCalendarRecurrence(
  recurrence: string[] | null | undefined
): ParsedGoogleCalendarRecurrence | null {
  const recurrenceRule = recurrence?.find((rule) => rule.startsWith('RRULE:'))

  if (!recurrenceRule) {
    return null
  }

  const parts = recurrenceRule
    .slice('RRULE:'.length)
    .split(';')
    .reduce<Record<string, string>>((result, entry) => {
      const [key, value] = entry.split('=')

      if (key && value) {
        result[key] = value
      }

      return result
    }, {})

  if (parts.FREQ !== 'WEEKLY') {
    return null
  }

  const repeatDays = parts.BYDAY
    ? parts.BYDAY.split(',')
        .map((code) => DAY_CODE_TO_INDEX.get(code))
        .filter((index): index is number => index !== undefined)
    : []

  if (parts.COUNT) {
    const repeatCount = Number.parseInt(parts.COUNT, 10)

    if (!Number.isFinite(repeatCount) || repeatCount < 1) {
      return null
    }

    return {
      repeat: true,
      repeatDays,
      repeatEndType: 'count',
      repeatUntil: new Date(),
      repeatCount
    }
  }

  if (!parts.UNTIL) {
    return null
  }

  const repeatUntil = parseUntilDate(parts.UNTIL)

  if (!repeatUntil) {
    return null
  }

  return {
    repeat: true,
    repeatDays,
    repeatEndType: 'date',
    repeatUntil,
    repeatCount: 4
  }
}

export function formatGoogleCalendarRecurrenceSummary(
  recurrence: string[] | null | undefined
): string | null {
  const parsedRecurrence = parseGoogleCalendarRecurrence(recurrence)

  if (!parsedRecurrence) {
    return null
  }

  const repeatDays = parsedRecurrence.repeatDays.map((day) => DAY_LABELS[day] ?? 'Mon')
  const dayLabel = repeatDays.length > 0 ? repeatDays.join(', ') : 'week'

  if (parsedRecurrence.repeatEndType === 'count') {
    return `Repeats every ${dayLabel} · ${parsedRecurrence.repeatCount} times`
  }

  return `Repeats every ${dayLabel} until ${formatSummaryDate(parsedRecurrence.repeatUntil)}`
}

function getRepeatDayCodes(draft: GoogleCalendarRepeatDraft): string[] {
  return getRepeatDayIndexes(draft).map((index) => RRULE_BYDAY[index] ?? 'MO')
}

function getRepeatDayIndexes(draft: GoogleCalendarRepeatDraft): number[] {
  const selectedDay = toMondayBasedDay(draft.selectedDate)
  const uniqueSortedDays = [...new Set(draft.repeatDays)].sort((left, right) => left - right)

  return uniqueSortedDays.length > 0 ? uniqueSortedDays : [selectedDay]
}

function formatUntilDate(value: Date): string {
  return `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, '0')}${String(value.getDate()).padStart(2, '0')}T235959Z`
}

function parseUntilDate(value: string): Date | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function toMondayBasedDay(value: Date): number {
  return (value.getDay() + 6) % 7
}

function formatSummaryDate(value: Date): string {
  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
