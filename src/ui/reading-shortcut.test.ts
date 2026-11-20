import { describe, expect, it } from 'vitest'
import { isReadingShortcut, readingShortcutLabel } from './reading-shortcut'

const key = (init: Partial<KeyboardEvent>) =>
  ({
    key: 'r',
    code: 'KeyR',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...init,
  }) as KeyboardEvent

describe('isReadingShortcut', () => {
  it('is Ctrl+Alt+R, or Option+Cmd+R on Apple platforms', () => {
    expect(isReadingShortcut(key({ ctrlKey: true, altKey: true }), false)).toBe(
      true,
    )
    expect(
      isReadingShortcut(key({ key: '®', metaKey: true, altKey: true }), true),
    ).toBe(true)
    expect(isReadingShortcut(key({ metaKey: true, altKey: true }), false)).toBe(
      false,
    )
    expect(isReadingShortcut(key({ ctrlKey: true, altKey: true }), true)).toBe(
      false,
    )
  })

  it('leaves reload, paste and other keys alone', () => {
    expect(isReadingShortcut(key({ ctrlKey: true }), false)).toBe(false)
    expect(
      isReadingShortcut(key({ ctrlKey: true, shiftKey: true }), false),
    ).toBe(false)
    expect(
      isReadingShortcut(
        key({ ctrlKey: true, altKey: true, shiftKey: true }),
        false,
      ),
    ).toBe(false)
    expect(
      isReadingShortcut(
        key({ key: 'v', code: 'KeyV', ctrlKey: true, altKey: true }),
        false,
      ),
    ).toBe(false)
  })

  it('follows the key position, not the layout', () => {
    expect(
      isReadingShortcut(key({ key: 'к', ctrlKey: true, altKey: true }), false),
    ).toBe(true)
  })

  it('labels the shortcut per platform', () => {
    expect(readingShortcutLabel(false)).toBe('Ctrl+Alt+R')
    expect(readingShortcutLabel(true)).toBe('⌥⌘R')
  })

  it('leaves AltGr+R to the keyboard layout', () => {
    const altGr = {
      ...key({ ctrlKey: true, altKey: true }),
      getModifierState: (state: string) => state === 'AltGraph',
    } as KeyboardEvent
    expect(isReadingShortcut(altGr, false)).toBe(false)
  })
})
