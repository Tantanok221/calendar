import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getNotificationToastMotion } from '../lib/notificationToastMotion'

interface NotificationToastProps {
  message: string | null
}

export default function NotificationToast({ message }: NotificationToastProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion()
  const motionState = getNotificationToastMotion(Boolean(prefersReducedMotion))

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 z-[80] -translate-x-1/2"
          style={{
            bottom: 24,
            maxWidth: 'calc(100vw - 32px)'
          }}
          initial={motionState.initial}
          animate={motionState.animate}
          exit={motionState.exit}
          transition={motionState.transition}
        >
          <div
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{
              background: 'rgba(24, 24, 24, 0.92)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 18px 44px rgba(0,0,0,0.35)'
            }}
          >
            {message}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
