import { describe, expect, test } from 'bun:test'
import { shouldSubmitOnEnterKeyDown } from './keyboardSubmit'

describe('shouldSubmitOnEnterKeyDown', () => {
  test('submits on a bare Enter from text inputs', () => {
    expect(
      shouldSubmitOnEnterKeyDown({
        key: 'Enter',
        tagName: 'INPUT',
        defaultPrevented: false
      })
    ).toBe(true)
  })

  test('does not submit when the child handler already consumed Enter', () => {
    expect(
      shouldSubmitOnEnterKeyDown({
        key: 'Enter',
        tagName: 'INPUT',
        defaultPrevented: true
      })
    ).toBe(false)
  })

  test('does not submit from buttons or modified Enter presses', () => {
    expect(
      shouldSubmitOnEnterKeyDown({
        key: 'Enter',
        tagName: 'BUTTON',
        defaultPrevented: false
      })
    ).toBe(false)

    expect(
      shouldSubmitOnEnterKeyDown({
        key: 'Enter',
        tagName: 'INPUT',
        ctrlKey: true,
        defaultPrevented: false
      })
    ).toBe(false)
  })
})
