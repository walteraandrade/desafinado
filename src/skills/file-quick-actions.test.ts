import { describe, expect, it } from 'vitest'
import { getQuickAction } from '../ai/quick-actions'
import { quickActionsForFile } from './file-quick-actions'

const enabled = [getQuickAction('shorter'), getQuickAction('make-instruction')]
const ids = (fileName: string | null) =>
  quickActionsForFile(fileName, enabled).map((action) => action.id)

describe('quickActionsForFile', () => {
  it('keeps the skill actions in a SKILL.md', () => {
    expect(ids('SKILL.md')).toEqual(['shorter', 'make-instruction'])
  })

  it('drops them from any other Markdown file', () => {
    expect(ids('notes.md')).toEqual(['shorter'])
  })

  it('drops them from a Document with no file', () => {
    expect(ids(null)).toEqual(['shorter'])
  })
})
