import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import NotificationToast from './NotificationToast'

describe('NotificationToast', () => {
  test('renders nothing when there is no message', () => {
    const html = renderToStaticMarkup(<NotificationToast message={null} />)

    expect(html).toBe('')
  })

  test('renders a bottom-screen toast message when visible', () => {
    const html = renderToStaticMarkup(<NotificationToast message="You copied an event" />)

    expect(html).toContain('You copied an event')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('class="pointer-events-none fixed')
    expect(html).toContain('bottom:24px')
  })
})
