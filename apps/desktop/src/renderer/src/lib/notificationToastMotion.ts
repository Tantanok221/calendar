export function getNotificationToastMotion(prefersReducedMotion: boolean): {
  initial: Record<string, number>
  animate: Record<string, number>
  exit: Record<string, number>
  transition: { duration: number } | SpringTransition
} {
  if (prefersReducedMotion) {
    return {
      initial: {
        opacity: 0
      },
      animate: {
        opacity: 1
      },
      exit: {
        opacity: 0
      },
      transition: {
        duration: 0.12
      }
    }
  }

  return {
    initial: {
      opacity: 0,
      y: 24,
      scale: 0.96
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    exit: {
      opacity: 0,
      y: 16,
      scale: 0.98
    },
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 24,
      mass: 0.8,
      bounce: 0.42
    }
  }
}

interface SpringTransition {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
  bounce: number
}
