export const isReadingShortcut = (
  event: KeyboardEvent,
  apple: boolean,
): boolean =>
  event.code === 'KeyR' &&
  (apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey) &&
  event.altKey &&
  !event.shiftKey

const FIELDS =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

export const isFieldOutsideEditor = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest(FIELDS) !== null &&
  target.closest('.cm-editor') === null

export const readingShortcutLabel = (apple: boolean): string =>
  apple ? '⌥⌘R' : 'Ctrl+Alt+R'
