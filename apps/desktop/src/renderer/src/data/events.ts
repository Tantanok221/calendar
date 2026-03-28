export type EventColor = 'violet' | 'red' | 'green' | 'orange' | 'blue'
export type CalendarName = 'Work' | 'Personal' | 'External'

export interface CalendarEvent {
  id: string
  title: string
  date: string // 'YYYY-MM-DD'
  startTime?: string // 'HH:MM' 24h
  endTime?: string
  allDay?: boolean
  color: EventColor
  calendar: CalendarName
}

export const EVENT_COLORS: Record<
  EventColor,
  { bg: string; border: string; text: string; dot: string; pillBg: string }
> = {
  // warm amber — replaces purple
  violet: {
    bg: 'rgba(201,168,106,0.13)',
    border: 'rgba(201,168,106,0.50)',
    text: '#D4AD72',
    dot: '#C9A86A',
    pillBg: 'rgba(201,168,106,0.18)'
  },
  // terracotta — replaces bright red
  red: {
    bg: 'rgba(192,120,96,0.13)',
    border: 'rgba(192,120,96,0.50)',
    text: '#C98A76',
    dot: '#C07860',
    pillBg: 'rgba(192,120,96,0.18)'
  },
  // sage green
  green: {
    bg: 'rgba(138,173,132,0.13)',
    border: 'rgba(138,173,132,0.50)',
    text: '#96BE90',
    dot: '#8AAD84',
    pillBg: 'rgba(138,173,132,0.18)'
  },
  // sandy ochre — replaces bright orange
  orange: {
    bg: 'rgba(196,153,100,0.13)',
    border: 'rgba(196,153,100,0.50)',
    text: '#D4AD78',
    dot: '#C49564',
    pillBg: 'rgba(196,153,100,0.18)'
  },
  // muted slate blue
  blue: {
    bg: 'rgba(120,155,170,0.13)',
    border: 'rgba(120,155,170,0.50)',
    text: '#88AEBE',
    dot: '#789BAA',
    pillBg: 'rgba(120,155,170,0.18)'
  }
}

export const CALENDARS: Array<{ name: CalendarName; color: EventColor }> = [
  { name: 'Work', color: 'violet' },
  { name: 'Personal', color: 'green' },
  { name: 'External', color: 'blue' }
]

// Today = March 28, 2026 (Saturday)
export const EVENTS: CalendarEvent[] = [
  // === Week of Mar 23–29 (Mon–Sun) — current week ===
  {
    id: 'e1',
    title: 'Team Standup',
    date: '2026-03-23',
    startTime: '09:00',
    endTime: '09:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e2',
    title: 'Design Review',
    date: '2026-03-23',
    startTime: '14:00',
    endTime: '15:00',
    color: 'blue',
    calendar: 'Work'
  },
  {
    id: 'e3',
    title: '1:1 with Alex',
    date: '2026-03-24',
    startTime: '10:00',
    endTime: '10:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e4',
    title: 'Team Lunch',
    date: '2026-03-24',
    startTime: '12:00',
    endTime: '13:00',
    color: 'green',
    calendar: 'Work'
  },
  {
    id: 'e5',
    title: 'Sprint Planning',
    date: '2026-03-25',
    startTime: '09:00',
    endTime: '11:00',
    color: 'orange',
    calendar: 'Work'
  },
  {
    id: 'e6',
    title: 'Yoga',
    date: '2026-03-25',
    startTime: '18:00',
    endTime: '19:00',
    color: 'green',
    calendar: 'Personal'
  },
  {
    id: 'e7',
    title: 'Code Review',
    date: '2026-03-26',
    startTime: '15:00',
    endTime: '16:00',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e8',
    title: 'Product Demo',
    date: '2026-03-26',
    startTime: '16:00',
    endTime: '17:00',
    color: 'red',
    calendar: 'Work'
  },
  {
    id: 'e9',
    title: 'Retrospective',
    date: '2026-03-27',
    startTime: '10:00',
    endTime: '11:00',
    color: 'orange',
    calendar: 'Work'
  },
  {
    id: 'e10',
    title: 'Morning Run',
    date: '2026-03-28',
    startTime: '07:30',
    endTime: '08:30',
    color: 'green',
    calendar: 'Personal'
  },
  {
    id: 'e11',
    title: 'Coffee w/ Sam',
    date: '2026-03-28',
    startTime: '11:00',
    endTime: '11:30',
    color: 'blue',
    calendar: 'External'
  },
  {
    id: 'e12',
    title: 'Prod Deploy v2.4',
    date: '2026-03-28',
    startTime: '14:00',
    endTime: '15:30',
    color: 'red',
    calendar: 'Work'
  },

  // === Week of Mar 30 – Apr 5 (next week) ===
  {
    id: 'e13',
    title: 'Team Standup',
    date: '2026-03-30',
    startTime: '09:00',
    endTime: '09:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e14',
    title: 'Q2 Planning',
    date: '2026-03-30',
    startTime: '10:00',
    endTime: '12:00',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e15',
    title: '1:1 with Alex',
    date: '2026-03-31',
    startTime: '10:00',
    endTime: '10:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e16',
    title: 'Architecture RFC',
    date: '2026-04-01',
    startTime: '14:00',
    endTime: '15:30',
    color: 'blue',
    calendar: 'Work'
  },

  // === Week of Mar 16–22 ===
  {
    id: 'e17',
    title: 'Team Standup',
    date: '2026-03-16',
    startTime: '09:00',
    endTime: '09:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e18',
    title: 'Team Standup',
    date: '2026-03-17',
    startTime: '09:00',
    endTime: '09:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e19',
    title: 'Mid-Sprint Review',
    date: '2026-03-18',
    startTime: '14:00',
    endTime: '15:00',
    color: 'orange',
    calendar: 'Work'
  },
  {
    id: 'e20',
    title: 'Team Standup',
    date: '2026-03-19',
    startTime: '09:00',
    endTime: '09:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e21',
    title: 'Hackathon Day 1',
    date: '2026-03-20',
    allDay: true,
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e22',
    title: 'Hackathon Day 2',
    date: '2026-03-21',
    allDay: true,
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e23',
    title: "Mia's Birthday",
    date: '2026-03-21',
    startTime: '19:00',
    endTime: '22:00',
    color: 'green',
    calendar: 'Personal'
  },

  // === Week of Mar 9–15 ===
  {
    id: 'e24',
    title: 'Engineering Sync',
    date: '2026-03-10',
    startTime: '14:00',
    endTime: '15:00',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e25',
    title: 'Sprint Planning',
    date: '2026-03-11',
    startTime: '09:00',
    endTime: '11:00',
    color: 'orange',
    calendar: 'Work'
  },
  {
    id: 'e26',
    title: 'Tech Talk: AI',
    date: '2026-03-12',
    startTime: '15:00',
    endTime: '16:30',
    color: 'blue',
    calendar: 'External'
  },
  {
    id: 'e27',
    title: 'Dentist',
    date: '2026-03-13',
    startTime: '09:00',
    endTime: '10:00',
    color: 'red',
    calendar: 'Personal'
  },

  // === Week of Mar 2–8 ===
  {
    id: 'e28',
    title: 'Q1 Review',
    date: '2026-03-02',
    allDay: true,
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e29',
    title: 'Team Standup',
    date: '2026-03-03',
    startTime: '09:00',
    endTime: '09:30',
    color: 'violet',
    calendar: 'Work'
  },
  {
    id: 'e30',
    title: 'All Hands',
    date: '2026-03-04',
    startTime: '10:00',
    endTime: '12:00',
    color: 'blue',
    calendar: 'External'
  },
  {
    id: 'e31',
    title: 'Doctor Appt.',
    date: '2026-03-06',
    startTime: '11:00',
    endTime: '12:00',
    color: 'red',
    calendar: 'Personal'
  }
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const getEventsForDate = (d: Date): CalendarEvent[] =>
  EVENTS.filter((e) => e.date === toDateStr(d))

/** Week starts on Monday */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export const getWeekDays = (date: Date): Date[] => {
  const start = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export const START_HOUR = 7
export const END_HOUR = 21
export const HOUR_HEIGHT = 64 // px per hour
