export function buildCalendarHours(startHour: number, endHour: number): number[] {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index)
}

export function formatCalendarHour(hour: number): string {
  const normalizedHour = hour % 24

  if (normalizedHour === 0) return '12 AM'
  if (normalizedHour === 12) return '12 PM'
  return normalizedHour < 12 ? `${normalizedHour} AM` : `${normalizedHour - 12} PM`
}
