import { useEffect, useState } from 'react'

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
