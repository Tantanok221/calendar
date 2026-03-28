import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { getClosestTimeSuggestion, getTimeSuggestions, TIME_SUGGESTIONS } from './timeSuggestions'

describe('getTimeSuggestions', () => {
  test('returns the closest typed time with neighboring suggestions', () => {
    expect(getTimeSuggestions('10:20', TIME_SUGGESTIONS, 5)).toEqual([
      '9:30 AM',
      '10:00 AM',
      '10:30 AM',
      '11:00 AM',
      '11:30 AM'
    ])
  })

  test('accepts compact keyboard input like 930', () => {
    expect(getTimeSuggestions('930', TIME_SUGGESTIONS, 5)).toEqual([
      '8:30 AM',
      '9:00 AM',
      '9:30 AM',
      '10:00 AM',
      '10:30 AM'
    ])
  })

  test('keeps text matching for partial input that is not a full time yet', () => {
    expect(getTimeSuggestions('7:', TIME_SUGGESTIONS, 5)).toEqual([
      '7:00 AM',
      '7:30 AM',
      '7:00 PM',
      '7:30 PM'
    ])
  })

  test('includes late-night suggestions when typing 11 PM', () => {
    expect(getTimeSuggestions('11 PM', TIME_SUGGESTIONS, 5)).toEqual([
      '9:30 PM',
      '10:00 PM',
      '10:30 PM',
      '11:00 PM',
      '11:30 PM'
    ])
  })

  test('keeps the default empty-state window starting at 7 AM', () => {
    expect(getTimeSuggestions('', TIME_SUGGESTIONS, 5)).toEqual([
      '7:00 AM',
      '7:30 AM',
      '8:00 AM',
      '8:30 AM',
      '9:00 AM'
    ])
  })
})

describe('getClosestTimeSuggestion', () => {
  test('returns the nearest suggestion for a typed time', () => {
    expect(getClosestTimeSuggestion('10:20', TIME_SUGGESTIONS)).toBe('10:30 AM')
  })

  test('returns the exact suggestion for compact keyboard input', () => {
    expect(getClosestTimeSuggestion('930', TIME_SUGGESTIONS)).toBe('9:30 AM')
  })

  test('returns null when the input is still incomplete', () => {
    expect(getClosestTimeSuggestion('7:', TIME_SUGGESTIONS)).toBeNull()
  })

  test('returns the exact late-night suggestion when available', () => {
    expect(getClosestTimeSuggestion('11 PM', TIME_SUGGESTIONS)).toBe('11:00 PM')
  })
})

describe('time input structure', () => {
  test('keeps the editable input out of Popover.Trigger', () => {
    const source = readFileSync(
      new URL('../components/NewEventPopover.tsx', import.meta.url),
      'utf8'
    )
    const timeInputSection = source.split('// ── DatePicker')[0] ?? source

    expect(timeInputSection).toContain('<Popover.Anchor asChild>')
    expect(timeInputSection).not.toContain('<Popover.Trigger asChild>')
  })
})
