import { describe, expect, it } from 'vitest'
import { isReadingShortcut } from './reading-shortcut'

const key = (init: Partial<KeyboardEvent>) =>
  ({
    key: 'v',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...init,
  }) as KeyboardEvent

describe('isReadingShortcut', () => {
  it('is Ctrl+Shift+V or Cmd+Shift+V', () => {
    expect(
      isReadingShortcut(key({ key: 'V', ctrlKey: true, shiftKey: true })),
    ).toBe(true)
    expect(
      isReadingShortcut(key({ key: 'v', metaKey: true, shiftKey: true })),
    ).toBe(true)
  })

  it('leaves plain paste and other keys alone', () => {
    expect(isReadingShortcut(key({ key: 'v', ctrlKey: true }))).toBe(false)
    expect(isReadingShortcut(key({ key: 'V', shiftKey: true }))).toBe(false)
    expect(
      isReadingShortcut(
        key({ key: 'V', ctrlKey: true, shiftKey: true, altKey: true }),
      ),
    ).toBe(false)
  })
})
