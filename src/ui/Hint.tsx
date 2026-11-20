import { detectApplePlatform, formatShortcut } from './platform'
import { readingShortcutLabel } from './reading-shortcut'

export function Hint({ reading }: { readonly reading: boolean }) {
  const apple = detectApplePlatform()
  return (
    <p className="text-sm text-ink-muted">
      {reading ? 'Reading. Edit with ' : 'Select text and press '}
      <kbd className="bg-code-bg px-1.5 py-0.5 font-sans text-ink">
        {reading ? readingShortcutLabel(apple) : formatShortcut('K', apple)}
      </kbd>
    </p>
  )
}
