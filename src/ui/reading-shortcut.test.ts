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
  it('is Ctrl+Shift+V, or Cmd+Shift+V on Apple platforms', () => {
    expect(
      isReadingShortcut(
        key({ key: 'V', ctrlKey: true, shiftKey: true }),
        false,
      ),
    ).toBe(true)
    expect(
      isReadingShortcut(key({ metaKey: true, shiftKey: true }), true),
    ).toBe(true)
    expect(
      isReadingShortcut(key({ metaKey: true, shiftKey: true }), false),
    ).toBe(false)
    expect(
      isReadingShortcut(key({ ctrlKey: true, shiftKey: true }), true),
    ).toBe(false)
  })

  it('leaves plain paste and other keys alone', () => {
    expect(isReadingShortcut(key({ ctrlKey: true }), false)).toBe(false)
    expect(isReadingShortcut(key({ key: 'V', shiftKey: true }), false)).toBe(
      false,
    )
    expect(
      isReadingShortcut(
        key({ ctrlKey: true, shiftKey: true, altKey: true }),
        false,
      ),
    ).toBe(false)
  })
})
