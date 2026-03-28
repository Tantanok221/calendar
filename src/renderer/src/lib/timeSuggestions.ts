const DEFAULT_VISIBLE_MINUTES = 7 * 60

function formatSuggestionLabel(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const meridiem = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${meridiem}`
}

function buildTimeSuggestions(): string[] {
  const suggestions: string[] = []

  for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += 30) {
    suggestions.push(formatSuggestionLabel(totalMinutes))
  }

  return suggestions
}

export const TIME_SUGGESTIONS = buildTimeSuggestions()

function normalizeTimeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

function parseSuggestionMinutes(value: string): number {
  const [time, meridiem] = value.split(' ')
  const [hourText, minuteText] = time.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (meridiem === 'AM') {
    return (hour % 12) * 60 + minute
  }

  return ((hour % 12) + 12) * 60 + minute
}

function getCandidateMinutes(input: string): number[] {
  const compact = normalizeTimeText(input)

  if (!compact) {
    return []
  }

  const meridiemMatch = compact.match(/(am|pm)$/)
  const meridiem = meridiemMatch?.[1] ?? null
  const rawTime = meridiem ? compact.slice(0, -2) : compact

  if (!rawTime || !/\d/.test(rawTime)) {
    return []
  }

  let hours: number
  let minutes: number

  if (rawTime.includes(':')) {
    const [hourPart, minutePart = ''] = rawTime.split(':')

    if (!hourPart || minutePart === '') {
      return []
    }

    hours = Number(hourPart)
    minutes = Number(minutePart)
  } else if (/^\d{1,2}$/.test(rawTime)) {
    hours = Number(rawTime)
    minutes = 0
  } else if (/^\d{3}$/.test(rawTime)) {
    hours = Number(rawTime.slice(0, 1))
    minutes = Number(rawTime.slice(1))
  } else if (/^\d{4}$/.test(rawTime)) {
    hours = Number(rawTime.slice(0, 2))
    minutes = Number(rawTime.slice(2))
  } else {
    return []
  }

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return []
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return []
    }

    const normalizedHour = meridiem === 'am' ? hours % 12 : (hours % 12) + 12
    return [normalizedHour * 60 + minutes]
  }

  if (hours < 0 || hours > 23) {
    return []
  }

  if (hours === 0 || hours > 12) {
    return [hours * 60 + minutes]
  }

  if (hours === 12) {
    return [12 * 60 + minutes]
  }

  return [hours * 60 + minutes, (hours + 12) * 60 + minutes]
}

function getClosestSuggestionIndex(
  suggestions: readonly string[],
  candidateMinutes: number[]
): number | null {
  if (candidateMinutes.length === 0) {
    return null
  }

  const ranked = suggestions.map((label, index) => ({
    index,
    distance: Math.min(
      ...candidateMinutes.map((candidateMinute) =>
        Math.abs(parseSuggestionMinutes(label) - candidateMinute)
      )
    )
  }))

  ranked.sort((left, right) => {
    if (left.distance !== right.distance) {
      return left.distance - right.distance
    }

    return left.index - right.index
  })

  return ranked[0]?.index ?? null
}

export function getClosestTimeSuggestion(
  input: string,
  suggestions: readonly string[] = TIME_SUGGESTIONS
): string | null {
  const closestIndex = getClosestSuggestionIndex(suggestions, getCandidateMinutes(input))
  return closestIndex === null ? null : (suggestions[closestIndex] ?? null)
}

function getWindowedSuggestions(
  suggestions: readonly string[],
  centerIndex: number,
  limit: number
): string[] {
  const size = Math.max(1, Math.min(limit, suggestions.length))
  const maxStart = Math.max(0, suggestions.length - size)
  const start = Math.max(0, Math.min(centerIndex - Math.floor(size / 2), maxStart))

  return suggestions.slice(start, start + size)
}

export function getTimeSuggestions(
  input: string,
  suggestions: readonly string[] = TIME_SUGGESTIONS,
  limit = suggestions.length
): string[] {
  const compactInput = normalizeTimeText(input)

  if (!compactInput) {
    const defaultStartIndex = suggestions.findIndex(
      (suggestion) => parseSuggestionMinutes(suggestion) === DEFAULT_VISIBLE_MINUTES
    )

    if (defaultStartIndex === -1) {
      return suggestions.slice(0, limit)
    }

    return suggestions.slice(defaultStartIndex, defaultStartIndex + limit)
  }

  const closestIndex = getClosestSuggestionIndex(suggestions, getCandidateMinutes(input))

  if (closestIndex !== null) {
    return getWindowedSuggestions(suggestions, closestIndex, limit)
  }

  const startsWithMatches = suggestions.filter((suggestion) =>
    normalizeTimeText(suggestion).startsWith(compactInput)
  )
  const includesMatches = suggestions.filter((suggestion) => {
    const normalizedSuggestion = normalizeTimeText(suggestion)
    return (
      !normalizedSuggestion.startsWith(compactInput) && normalizedSuggestion.includes(compactInput)
    )
  })

  return [...startsWithMatches, ...includesMatches].slice(0, limit)
}
