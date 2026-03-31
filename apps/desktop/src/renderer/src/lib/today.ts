import { useEffect, useState } from 'react'

interface DayViewInitialScrollTopInput {
  reference?: Date
  isToday: boolean
  viewportHeight: number
  dayStartHour?: number
  dayEndHour?: number
  hourHeight?: number
  fallbackHour?: number
}

export function getToday(reference: Date = new Date()): Date {
  const today = new Date(reference)
  today.setHours(0, 0, 0, 0)
  return today
}

export function addDays(date: Date, amount: number): Date {
  const next = getToday(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function addMonths(date: Date, amount: number): Date {
  const next = getToday(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

export function getNextMonday(reference: Date = new Date()): Date {
  const today = getToday(reference)
  const day = today.getDay()
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day

  return addDays(today, daysUntilMonday)
}

export function getMillisecondsUntilNextDay(reference: Date = new Date()): number {
  const nextDay = addDays(reference, 1)

  return Math.max(1, nextDay.getTime() - reference.getTime())
}

export function getDayViewInitialScrollTop({
  reference = new Date(),
  isToday,
  viewportHeight,
  dayStartHour = 0,
  dayEndHour = 24,
  hourHeight = 64,
  fallbackHour = 8
}: DayViewInitialScrollTopInput): number {
  const totalHeight = (dayEndHour - dayStartHour) * hourHeight
  const maxScrollTop = Math.max(0, totalHeight - viewportHeight)
  const fallbackScrollTop = clampScrollTop(
    (fallbackHour - dayStartHour) * hourHeight - 8,
    maxScrollTop
  )

  if (!isToday) {
    return fallbackScrollTop
  }

  const currentMinutes = reference.getHours() * 60 + reference.getMinutes()
  const dayStartMinutes = dayStartHour * 60
  const dayEndMinutes = dayEndHour * 60

  if (currentMinutes < dayStartMinutes || currentMinutes > dayEndMinutes) {
    return fallbackScrollTop
  }

  const currentOffsetTop = ((currentMinutes - dayStartMinutes) / 60) * hourHeight

  return clampScrollTop(currentOffsetTop - viewportHeight * 0.35, maxScrollTop)
}

export function useToday(): Date {
  const [today, setToday] = useState(() => getToday())

  useEffect(() => {
    let timeoutId: number | undefined

    const scheduleNextUpdate = (): void => {
      timeoutId = window.setTimeout(() => {
        setToday(getToday())
        scheduleNextUpdate()
      }, getMillisecondsUntilNextDay())
    }

    scheduleNextUpdate()

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  return today
}

function clampScrollTop(value: number, maxScrollTop: number): number {
  return Math.max(0, Math.min(maxScrollTop, Math.round(value)))
}
