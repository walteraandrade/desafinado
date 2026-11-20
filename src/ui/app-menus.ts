import type { Menu, MenuItem } from './MenuBar'
import { formatShortcut } from './platform'

export type AppMenuState = {
  readonly apple: boolean
  readonly documentReady: boolean
  readonly reviewReady: boolean
  readonly reviewRunning: boolean
  readonly openSuggestions: number
  readonly problems: readonly string[]
  readonly reading: boolean
}

export type AppMenuActions = {
  readonly startNew: () => void
  readonly open: () => void
  readonly save: (saveAs: boolean) => void
  readonly showProblems: () => void
  readonly openPreferences: () => void
  readonly review: () => void
  readonly stopReview: () => void
  readonly acceptAll: () => void
  readonly rejectAll: () => void
  readonly toggleReading: () => void
}

const problemCount = (count: number): string =>
  count === 1 ? '1 problem' : `${count} problems`

const fileMenu = (
  { apple, documentReady, problems }: AppMenuState,
  actions: AppMenuActions,
): Menu => {
  const blocked = !documentReady
  const problemItems: readonly MenuItem[] =
    problems.length === 0
      ? []
      : [
          {
            label: `Frontmatter: ${problemCount(problems.length)}`,
            tone: 'danger',
            separated: true,
            onSelect: actions.showProblems,
          },
        ]
  return {
    label: 'File',
    ...(problems.length > 0 && { badge: String(problems.length) }),
    items: [
      {
        label: 'New',
        shortcut: formatShortcut('N', apple),
        disabled: blocked,
        onSelect: actions.startNew,
      },
      {
        label: 'Open…',
        shortcut: formatShortcut('O', apple),
        disabled: blocked,
        onSelect: actions.open,
      },
      {
        label: 'Save',
        shortcut: formatShortcut('S', apple),
        disabled: blocked,
        onSelect: () => actions.save(false),
      },
      {
        label: 'Save as…',
        shortcut: apple ? '⇧⌘S' : 'Ctrl+Shift+S',
        disabled: blocked,
        onSelect: () => actions.save(true),
      },
      ...problemItems,
      {
        label: 'Preferences…',
        shortcut: formatShortcut(',', apple),
        separated: true,
        onSelect: actions.openPreferences,
      },
    ],
  }
}

const editMenu = (
  { apple, reviewReady, reviewRunning, openSuggestions, reading }: AppMenuState,
  actions: AppMenuActions,
): Menu => ({
  label: 'Edit',
  items: [
    reviewRunning
      ? { label: 'Stop Review', onSelect: actions.stopReview }
      : {
          label: 'Review…',
          disabled: !reviewReady,
          onSelect: actions.review,
        },
    {
      label: 'Accept all suggestions',
      disabled: openSuggestions === 0,
      separated: true,
      onSelect: actions.acceptAll,
    },
    {
      label: 'Reject all suggestions',
      disabled: openSuggestions === 0,
      onSelect: actions.rejectAll,
    },
    {
      label: reading ? 'Edit text' : 'Reading view',
      shortcut: apple ? '⇧⌘V' : 'Ctrl+Shift+V',
      separated: true,
      onSelect: actions.toggleReading,
    },
  ],
})

export const appMenus = (
  state: AppMenuState,
  actions: AppMenuActions,
): readonly Menu[] => [fileMenu(state, actions), editMenu(state, actions)]
