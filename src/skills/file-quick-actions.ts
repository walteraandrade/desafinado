import { type QuickAction, quickActionsFor } from '../ai/quick-actions'
import { isSkillFile } from './scan-skills'

export const quickActionsForFile = (
  fileName: string | null,
  actions: readonly QuickAction[],
): readonly QuickAction[] => quickActionsFor(isSkillFile(fileName), actions)
