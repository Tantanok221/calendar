import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import Sidebar from './Sidebar'

describe('Sidebar', () => {
  test('renders with a full-height scroll container', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        events={[]}
        calendars={[]}
        hiddenCalendars={new Set()}
        currentDate={new Date('2026-04-06T12:00:00')}
        today={new Date('2026-04-06T12:00:00')}
        view="week"
        onDateSelect={() => {}}
        onToggleCalendarVisibility={() => {}}
        onOpenNewEvent={() => {}}
      />
    )

    expect(html).toContain('class="flex h-full min-h-0 flex-col shrink-0 overflow-y-auto"')
  })
})
