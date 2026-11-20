export const isReadingShortcut = (
  event: KeyboardEvent,
  apple: boolean,
): boolean =>
  event.key.toLowerCase() === 'v' &&
  (apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey) &&
  event.shiftKey &&
  !event.altKey

const FIELDS = 'input, textarea, select, [contenteditable="true"]'

export const isFieldOutsideEditor = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest(FIELDS) !== null &&
  target.closest('.cm-editor') === null
