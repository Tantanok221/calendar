import type { CSSProperties } from 'react'
import type { TimedSelectionRange } from './calendarDrag'

export const NEW_EVENT_PREVIEW_SURFACE_STYLE: CSSProperties = {
  background: 'rgba(215,206,178,0.20)',
  border: '1px solid var(--accent-border)',
  boxShadow: 'inset 0 0 0 1px rgba(215,206,178,0.12)',
  pointerEvents: 'none'
}

export function getVisibleTimedPreviewRange({
  allDayPreviewVisible,
  pinnedPreview,
  timedSelectionPreview
}: {
  allDayPreviewVisible: boolean
  pinnedPreview: TimedSelectionRange | null
  timedSelectionPreview: TimedSelectionRange | null
}): TimedSelectionRange | null {
  if (allDayPreviewVisible) {
    return null
  }

  return pinnedPreview ?? timedSelectionPreview
}
