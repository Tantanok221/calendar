export interface PopoverAnchor {
  top: number
  left: number
}

export function computeAnchor(rect: DOMRect): PopoverAnchor {
  const W = 260
  const GAP = 10
  const rightFits = window.innerWidth - rect.right >= W + GAP
  const left = rightFits ? rect.right + GAP : rect.left - W - GAP
  const top = Math.min(Math.max(rect.top, 8), window.innerHeight - 160)

  return { top, left: Math.max(8, left) }
}
