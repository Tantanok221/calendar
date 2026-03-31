import { timeToMinutes } from '../data/events'
import type { CalendarEvent } from '../data/events'

export interface TimedEventLayout {
  columnIndex: number
  columnCount: number
}

interface ActiveTimedEvent {
  columnIndex: number
  endMinutes: number
}

interface ClusterAssignment {
  columnIndex: number
  eventId: string
}

export function buildTimedEventLayout(
  events: CalendarEvent[]
): Record<string, TimedEventLayout> {
  const layout: Record<string, TimedEventLayout> = {}
  const sortedEvents = [...events].sort((left, right) => {
    const startDelta = timeToMinutes(left.startTime!) - timeToMinutes(right.startTime!)
    if (startDelta !== 0) return startDelta

    const endDelta = timeToMinutes(left.endTime!) - timeToMinutes(right.endTime!)
    if (endDelta !== 0) return endDelta

    return left.id.localeCompare(right.id)
  })

  let activeEvents: ActiveTimedEvent[] = []
  let clusterAssignments: ClusterAssignment[] = []
  let clusterColumnCount = 1

  const flushCluster = (): void => {
    if (clusterAssignments.length === 0) return

    for (const assignment of clusterAssignments) {
      layout[assignment.eventId] = {
        columnIndex: assignment.columnIndex,
        columnCount: clusterColumnCount
      }
    }

    clusterAssignments = []
    clusterColumnCount = 1
  }

  for (const event of sortedEvents) {
    const startMinutes = timeToMinutes(event.startTime!)

    activeEvents = activeEvents.filter((activeEvent) => activeEvent.endMinutes > startMinutes)

    if (activeEvents.length === 0) {
      flushCluster()
    }

    const usedColumns = new Set(activeEvents.map((activeEvent) => activeEvent.columnIndex))
    let columnIndex = 0
    while (usedColumns.has(columnIndex)) {
      columnIndex += 1
    }

    activeEvents.push({
      columnIndex,
      endMinutes: timeToMinutes(event.endTime!)
    })
    clusterAssignments.push({
      columnIndex,
      eventId: event.id
    })
    clusterColumnCount = Math.max(clusterColumnCount, activeEvents.length)
  }

  flushCluster()

  return layout
}
