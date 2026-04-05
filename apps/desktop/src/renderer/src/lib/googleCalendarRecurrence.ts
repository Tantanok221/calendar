export type RepeatEndType = 'date' | 'count'
export type RepeatFrequency = 'weekly' | 'monthly'

export interface GoogleCalendarRepeatDraft {
  selectedDate: Date
  repeat: boolean
  repeatFrequency: RepeatFrequency
  repeatDays: number[]
  repeatEndType: RepeatEndType
  repeatUntil: Date
  repeatCount: number
}

export interface ParsedGoogleCalendarRecurrence {
  repeat: boolean
  repeatFrequency: RepeatFrequency
  repeatDays: number[]
  repeatMonthDay: number | null
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

  const parts =
    draft.repeatFrequency === 'monthly'
      ? ['RRULE:FREQ=MONTHLY', `BYMONTHDAY=${draft.selectedDate.getDate()}`]
      : ['RRULE:FREQ=WEEKLY', `BYDAY=${getRepeatDayCodes(draft).join(',')}`]

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

  if (parts.FREQ === 'MONTHLY') {
    const repeatMonthDay = parts.BYMONTHDAY ? Number.parseInt(parts.BYMONTHDAY, 10) : null

    if (repeatMonthDay !== null && (!Number.isFinite(repeatMonthDay) || repeatMonthDay < 1)) {
      return null
    }

    return buildParsedRecurrence({
      repeatFrequency: 'monthly',
      repeatDays: [],
      repeatMonthDay
    }, parts)
  }

  if (parts.FREQ !== 'WEEKLY') {
    return null
  }

  const repeatDays = parts.BYDAY
    ? parts.BYDAY.split(',')
        .map((code) => DAY_CODE_TO_INDEX.get(code))
        .filter((index): index is number => index !== undefined)
    : []

  return buildParsedRecurrence(
    {
      repeatFrequency: 'weekly',
      repeatDays,
      repeatMonthDay: null
    },
    parts
  )
}

export function formatGoogleCalendarRecurrenceSummary(
  recurrence: string[] | null | undefined
): string | null {
  const parsedRecurrence = parseGoogleCalendarRecurrence(recurrence)

  if (!parsedRecurrence) {
    return null
  }

  const frequencyLabel =
    parsedRecurrence.repeatFrequency === 'monthly'
      ? parsedRecurrence.repeatMonthDay
        ? `monthly on the ${formatOrdinal(parsedRecurrence.repeatMonthDay)}`
        : 'monthly'
      : (() => {
          const repeatDays = parsedRecurrence.repeatDays.map((day) => DAY_LABELS[day] ?? 'Mon')
          const dayLabel = repeatDays.length > 0 ? repeatDays.join(', ') : 'week'
          return `every ${dayLabel}`
        })()

  if (parsedRecurrence.repeatEndType === 'count') {
    return `Repeats ${frequencyLabel} · ${parsedRecurrence.repeatCount} times`
  }

  return `Repeats ${frequencyLabel} until ${formatSummaryDate(parsedRecurrence.repeatUntil)}`
}

export function formatMonthlyRepeatTarget(dayOfMonth: number): string {
  return `On the ${formatOrdinal(dayOfMonth)} of each month`
}

function getRepeatDayCodes(draft: GoogleCalendarRepeatDraft): string[] {
  return getRepeatDayIndexes(draft).map((index) => RRULE_BYDAY[index] ?? 'MO')
}

function getRepeatDayIndexes(draft: GoogleCalendarRepeatDraft): number[] {
  const selectedDay = toMondayBasedDay(draft.selectedDate)
  const uniqueSortedDays = [...new Set(draft.repeatDays)].sort((left, right) => left - right)

  return uniqueSortedDays.length > 0 ? uniqueSortedDays : [selectedDay]
}

function buildParsedRecurrence(
  recurrence: Pick<
    ParsedGoogleCalendarRecurrence,
    'repeatFrequency' | 'repeatDays' | 'repeatMonthDay'
  >,
  parts: Record<string, string>
): ParsedGoogleCalendarRecurrence | null {
  if (parts.COUNT) {
    const repeatCount = Number.parseInt(parts.COUNT, 10)

    if (!Number.isFinite(repeatCount) || repeatCount < 1) {
      return null
    }

    return {
      repeat: true,
      ...recurrence,
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
    ...recurrence,
    repeatEndType: 'date',
    repeatUntil,
    repeatCount: 4
  }
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

function formatOrdinal(value: number): string {
  const remainder = value % 10
  const teen = value % 100

  if (teen >= 11 && teen <= 13) {
    return `${value}th`
  }

  if (remainder === 1) {
    return `${value}st`
  }

  if (remainder === 2) {
    return `${value}nd`
  }

  if (remainder === 3) {
    return `${value}rd`
  }

  return `${value}th`
}
