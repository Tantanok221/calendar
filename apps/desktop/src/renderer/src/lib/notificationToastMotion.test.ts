import { describe, expect, test } from 'bun:test'
import { getNotificationToastMotion } from './notificationToastMotion'

describe('getNotificationToastMotion', () => {
  test('uses a springy bounce entrance for standard motion', () => {
    expect(getNotificationToastMotion(false)).toEqual({
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
    })
  })

  test('disables the bounce motion when reduced motion is preferred', () => {
    expect(getNotificationToastMotion(true)).toEqual({
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
    })
  })
})
