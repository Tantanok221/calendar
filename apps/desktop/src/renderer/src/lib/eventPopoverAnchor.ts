export interface PopoverAnchor {
  top: number
  left: number
}

interface RectLike {
  top: number
  left: number
  right: number
  bottom: number
}

export function computeAnchor(rect: DOMRect): PopoverAnchor {
  const W = 260
  const GAP = 10
  const rightFits = window.innerWidth - rect.right >= W + GAP
  const left = rightFits ? rect.right + GAP : rect.left - W - GAP
  const top = Math.min(Math.max(rect.top, 8), window.innerHeight - 160)

  return { top, left: Math.max(8, left) }
}

export function computeAnchorFromPoint(
  clientX: number,
  clientY: number,
  popoverWidth = 340
): PopoverAnchor {
  const GAP = 12
  const rightFits = window.innerWidth - clientX >= popoverWidth + GAP
  const left = rightFits ? clientX + GAP : clientX - popoverWidth - GAP
  const top = Math.min(Math.max(clientY - 24, 8), window.innerHeight - 480)

  return { top, left: Math.max(8, left) }
}

export function computeAnchorFromTimedSelectionRect(
  rect: RectLike,
  popoverWidth = 340
): PopoverAnchor {
  const GAP = 12
  const rightFits = window.innerWidth - rect.right >= popoverWidth + GAP
  const left = rightFits ? rect.right + GAP : rect.left - popoverWidth - GAP
  const top = Math.min(Math.max(rect.top, 8), window.innerHeight - 480)

  return { top, left: Math.max(8, left) }
}
