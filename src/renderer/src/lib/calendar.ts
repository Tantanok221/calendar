export type CalendarDay = {
  key: string
  dayOfMonth: number
  currentMonth: boolean
  isToday: boolean
  weekend: boolean
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function buildMonthGrid(
  year: number,
  monthIndex: number,
  today = new Date()
): CalendarDay[] {
  const monthStart = createLocalDate(year, monthIndex, 1)
  const firstWeekdayOffset = (monthStart.getDay() + 6) % 7
  const firstVisibleDate = createLocalDate(year, monthIndex, 1 - firstWeekdayOffset)
  const todayKey = toDateKey(today)

  return Array.from({ length: 42 }, (_, index) => {
    const date = createLocalDate(
      firstVisibleDate.getFullYear(),
      firstVisibleDate.getMonth(),
      firstVisibleDate.getDate() + index
    )
    const key = toDateKey(date)

    return {
      key,
      dayOfMonth: date.getDate(),
      currentMonth: date.getMonth() === monthIndex,
      isToday: key === todayKey,
      weekend: date.getDay() === 0 || date.getDay() === 6
    }
  })
}

export function shiftMonth(date: Date, delta: number): Date {
  return createLocalDate(date.getFullYear(), date.getMonth() + delta, 1)
}

export function formatMonthLabel(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function formatLongDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function createLocalDate(year: number, monthIndex: number, dayOfMonth: number): Date {
  return new Date(year, monthIndex, dayOfMonth, 12)
}

function toDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}
