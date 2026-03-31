import type { Rectangle } from 'electron'

const PANEL_INSET = 12
const PANEL_WIDTH_RATIO = 0.4
const PANEL_MIN_WIDTH = 360
const PANEL_MAX_WIDTH = 720

export function getPanelWindowBounds(workArea: Rectangle): Rectangle {
  const width = Math.max(
    PANEL_MIN_WIDTH,
    Math.min(PANEL_MAX_WIDTH, Math.round(workArea.width * PANEL_WIDTH_RATIO))
  )

  return {
    x: workArea.x + workArea.width - width - PANEL_INSET,
    y: workArea.y + PANEL_INSET,
    width,
    height: Math.max(320, workArea.height - PANEL_INSET * 2)
  }
}
