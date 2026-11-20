import { describe, expect, it, vi } from 'vitest'
import { type AppMenuState, appMenus } from './app-menus'

const state = (overrides: Partial<AppMenuState> = {}): AppMenuState => ({
  apple: false,
  documentReady: true,
  reviewReady: true,
  reviewRunning: false,
  openSuggestions: 0,
  problems: [],
  reading: false,
  ...overrides,
})

const actions = () => ({
  startNew: vi.fn(),
  open: vi.fn(),
  save: vi.fn(),
  showProblems: vi.fn(),
  openPreferences: vi.fn(),
  review: vi.fn(),
  stopReview: vi.fn(),
  acceptAll: vi.fn(),
  rejectAll: vi.fn(),
  toggleReading: vi.fn(),
})

const labels = (menu: { items: readonly { label: string }[] }) =>
  menu.items.map((item) => item.label)

describe('appMenus', () => {
  it('builds File and Edit with their shortcuts', () => {
    const [file, edit] = appMenus(state(), actions())
    expect(file?.label).toBe('File')
    expect(labels(file ?? { items: [] })).toEqual([
      'New',
      'Open…',
      'Save',
      'Save as…',
      'Preferences…',
    ])
    expect(file?.items.map((item) => item.shortcut)).toEqual([
      'Ctrl+N',
      'Ctrl+O',
      'Ctrl+S',
      'Ctrl+Shift+S',
      'Ctrl+,',
    ])
    expect(edit?.label).toBe('Edit')
    expect(labels(edit ?? { items: [] })).toEqual([
      'Review…',
      'Accept all suggestions',
      'Reject all suggestions',
      'Reading view',
    ])
  })

  it('uses macOS shortcuts', () => {
    const [file] = appMenus(state({ apple: true }), actions())
    expect(file?.items.map((item) => item.shortcut)).toEqual([
      '⌘N',
      '⌘O',
      '⌘S',
      '⇧⌘S',
      '⌘,',
    ])
  })

  it('disables the file commands until the Document is ready', () => {
    const [file] = appMenus(state({ documentReady: false }), actions())
    expect(file?.items.map((item) => item.disabled === true)).toEqual([
      true,
      true,
      true,
      true,
      false,
    ])
  })

  it('wires Save and Save as', () => {
    const wired = actions()
    const [file] = appMenus(state(), wired)
    file?.items[2]?.onSelect()
    file?.items[3]?.onSelect()
    expect(wired.save.mock.calls).toEqual([[false], [true]])
  })

  it('lists frontmatter problems in File and badges the menu', () => {
    const wired = actions()
    const [file] = appMenus(state({ problems: ['a', 'b'] }), wired)
    expect(file?.badge).toBe('2')
    const item = file?.items.find((entry) => entry.tone === 'danger')
    expect(item?.label).toBe('Frontmatter: 2 problems')
    item?.onSelect()
    expect(wired.showProblems).toHaveBeenCalled()
  })

  it('turns Review into Stop Review while a pass runs', () => {
    const wired = actions()
    const [, edit] = appMenus(state({ reviewRunning: true }), wired)
    expect(edit?.items[0]?.label).toBe('Stop Review')
    edit?.items[0]?.onSelect()
    expect(wired.stopReview).toHaveBeenCalled()
  })

  it('enables Accept all and Reject all only with open suggestions', () => {
    const idle = appMenus(state(), actions())[1]
    expect(idle?.items.slice(1, 3).every((item) => item.disabled)).toBe(true)
    const busy = appMenus(state({ openSuggestions: 3 }), actions())[1]
    expect(busy?.items.slice(1, 3).some((item) => item.disabled)).toBe(false)
  })

  it('disables Review until the editor can review', () => {
    const [, edit] = appMenus(state({ reviewReady: false }), actions())
    expect(edit?.items[0]?.disabled).toBe(true)
  })

  it('toggles the Reading view from Edit', () => {
    const wired = actions()
    const [, editing] = appMenus(state(), wired)
    const item = editing?.items.at(-1)
    expect(item?.shortcut).toBe('Ctrl+Shift+V')
    item?.onSelect()
    expect(wired.toggleReading).toHaveBeenCalled()
    const [, reading] = appMenus(state({ reading: true, apple: true }), wired)
    expect(reading?.items.at(-1)?.label).toBe('Edit text')
    expect(reading?.items.at(-1)?.shortcut).toBe('⇧⌘V')
  })
})
