export const isReadingShortcut = (event: KeyboardEvent): boolean =>
  event.key.toLowerCase() === 'v' &&
  (event.ctrlKey || event.metaKey) &&
  event.shiftKey &&
  !event.altKey
