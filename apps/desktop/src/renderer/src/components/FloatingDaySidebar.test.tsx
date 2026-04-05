import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import FloatingDaySidebar from './FloatingDaySidebar'

describe('FloatingDaySidebar', () => {
  test('renders the selected day and omits the floating close button', () => {
    const html = renderToStaticMarkup(
      <FloatingDaySidebar
        events={[]}
        calendars={[]}
        currentDate={new Date('2026-04-02T12:00:00')}
        today={new Date('2026-03-31T12:00:00')}
        onEventChange={() => {}}
        onEventDelete={() => {}}
        onAllDayCreate={() => {}}
        onTimedSelectionCreate={() => {}}
      />
    )

    expect(html).toContain('Thursday, April 2')
    expect(html).not.toContain('Close floating day view')
  })
})
