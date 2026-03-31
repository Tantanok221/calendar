interface AllDayEventPillMotionOptions {
  dragging: boolean
  animateOnMount?: boolean
}

interface AllDayEventPillMotion {
  initial: false | { opacity: number; x: number }
  animate: { opacity: number; x: number }
  transition: { duration: number; ease: 'easeOut' }
  exit?: { opacity: number; x: number }
}

export function getAllDayEventPillMotion({
  dragging,
  animateOnMount = true
}: AllDayEventPillMotionOptions): AllDayEventPillMotion {
  const animate = { opacity: dragging ? 0.28 : 1, x: 0 }
  const transition = { duration: 0.15, ease: 'easeOut' as const }

  if (!animateOnMount) {
    return {
      initial: false,
      animate,
      transition
    }
  }

  return {
    initial: { opacity: 0, x: -4 },
    animate,
    exit: { opacity: 0, x: -4 },
    transition
  }
}
