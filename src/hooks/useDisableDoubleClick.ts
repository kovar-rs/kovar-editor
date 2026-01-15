import { useEffect } from 'react'
import { useEditor, StateNode } from 'tldraw'

/**
 * Disable double-click on canvas to create text shape.
 */
export function useDisableDoubleClick() {
  const editor = useEditor()

  useEffect(() => {
    type IdleStateNode = StateNode & {
      handleDoubleClickOnCanvas(): void
    }

    const selectIdleState = editor.getStateDescendant('select.idle') as IdleStateNode | null
    if (selectIdleState) {
      selectIdleState.handleDoubleClickOnCanvas = () => {
        // Do nothing - disable double-click text creation
      }
    }
  }, [editor])
}
