import { describe, expect, it } from 'vitest'
import { isReadingShortcut, readingShortcutLabel } from './reading-shortcut'

const key = (init: Partial<KeyboardEvent>) =>
  ({
    key: 'v',
    code: 'KeyV',
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

  it('follows the key position, not the layout', () => {
    expect(
      isReadingShortcut(
        key({ key: 'м', ctrlKey: true, shiftKey: true }),
        false,
      ),
    ).toBe(true)
    expect(
      isReadingShortcut(
        key({ key: 'v', code: 'KeyB', ctrlKey: true, shiftKey: true }),
        false,
      ),
    ).toBe(false)
  })

  it('labels the shortcut per platform', () => {
    expect(readingShortcutLabel(false)).toBe('Ctrl+Shift+V')
    expect(readingShortcutLabel(true)).toBe('⇧⌘V')
  })
})
