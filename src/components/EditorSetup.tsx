import { useEditorDefaults } from '../hooks/useEditorDefaults'
import { useDisableDoubleClick } from '../hooks/useDisableDoubleClick'
import { useLoadSnapshot } from '../hooks/useLoadSnapshot'

/**
 * Compose all editor setup hooks.
 * This component must be rendered inside Tldraw context.
 */
export function EditorSetup() {
  useEditorDefaults()
  useDisableDoubleClick()
  useLoadSnapshot()

  return null
}
