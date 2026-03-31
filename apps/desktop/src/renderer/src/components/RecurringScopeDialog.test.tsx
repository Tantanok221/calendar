import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'bun:test'
import { RecurringScopeDialogBody } from './RecurringScopeDialog'

describe('Recurring scope dialogs', () => {
  test('renders the redesigned delete prompt with event context', () => {
    const html = renderToStaticMarkup(
      <RecurringScopeDialogBody
        onClose={() => {}}
        kind="delete"
        onChooseInstance={() => {}}
        onChooseSeries={() => {}}
        busyScope={null}
      />
    )

    expect(html).toContain('Delete repeating event?')
    expect(html).toContain('Delete this event')
    expect(html).toContain('Delete all events')
    expect(html).toContain('Whole series')
  })

  test('shows a visible loading state for the active recurring edit action', () => {
    const html = renderToStaticMarkup(
      <RecurringScopeDialogBody
        onClose={() => {}}
        kind="edit"
        onChooseInstance={() => {}}
        onChooseSeries={() => {}}
        busyScope="series"
      />
    )

    expect(html).toContain('Editing all events...')
    expect(html).toContain('Working')
    expect(html).toContain('Saving changes to every event in the series...')
    expect(html).toContain('aria-busy="true"')
  })
})
