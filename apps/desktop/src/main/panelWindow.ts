import type { Rectangle } from 'electron'

const PANEL_INSET = 12
const PANEL_WIDTH_RATIO = 0.4
const PANEL_MIN_WIDTH = 360
const PANEL_MAX_WIDTH = 720

interface PanelWindowLike {
  setBounds: (bounds: Rectangle) => void
  setAlwaysOnTop: (flag: boolean, level?: 'screen-saver') => void
  moveTop: () => void
  show: () => void
  focus: () => void
  webContents: {
    isLoadingMainFrame: () => boolean
    once: (event: 'did-finish-load', callback: () => void) => void
    focus: () => void
  }
}

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

export function revealPanelWindow(window: PanelWindowLike, workArea: Rectangle): void {
  window.setBounds(getPanelWindowBounds(workArea))
  window.setAlwaysOnTop(true, 'screen-saver')
  window.moveTop()

  const showAndFocus = (): void => {
    window.show()
    window.focus()
    window.webContents.focus()
  }

  if (window.webContents.isLoadingMainFrame()) {
    window.webContents.once('did-finish-load', showAndFocus)
    return
  }

  showAndFocus()
}
