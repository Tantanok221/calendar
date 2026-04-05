import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import NewEventPopover from './NewEventPopover'
import type { RendererCalendar } from '../lib/googleCalendarSync'

const CALENDARS: RendererCalendar[] = [
  { id: 'primary', name: 'Work', color: 'violet', group: 'my' }
]

describe('NewEventPopover', () => {
  test('renders an internal host for nested popovers', () => {
    const html = renderToStaticMarkup(
      <NewEventPopover
        open
        onClose={() => {}}
        calendars={CALENDARS}
        onCreateEvent={async () => {}}
        anchor={{ top: 120, left: 180 }}
      />
    )

    expect(html).toContain('data-new-event-popover-layer=""')
  })
})
