import { useEffect } from 'react'
import { useEditor } from 'tldraw'

/**
 * Checks if user is currently editing text (input, textarea, contenteditable, or tldraw text).
 */
function isEditingText(editor: ReturnType<typeof useEditor>, target: EventTarget | null): boolean {
  // Check standard form elements
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true
  }

  // Check contenteditable elements (used by tldraw for text editing)
  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  // Check if tldraw is in text editing mode
  if (editor.getEditingShapeId() !== null) {
    return true
  }

  return false
}

/**
 * Keyboard shortcut handler that prevents browser defaults and enables editor shortcuts.
 * Note: Copy/Paste/Cut are handled by tldraw's native clipboard events.
 */
export function KeyboardShortcuts() {
  const editor = useEditor()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is editing text
      if (isEditingText(editor, e.target)) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Prevent browser defaults for common shortcuts
      if (modKey) {
        switch (e.key.toLowerCase()) {
          case 'd': // Duplicate
            e.preventDefault()
            {
              const selected = editor.getSelectedShapeIds()
              if (selected.length > 0) {
                editor.duplicateShapes(selected, { x: 20, y: 20 })
              }
            }
            break

          case 'a': // Select all
            e.preventDefault()
            editor.selectAll()
            break

          case 'z': // Undo/Redo
            e.preventDefault()
            if (e.shiftKey) {
              editor.redo()
            } else {
              editor.undo()
            }
            break

          case 'g': // Group/Ungroup
            e.preventDefault()
            if (e.shiftKey) {
              editor.ungroupShapes(editor.getSelectedShapeIds())
            } else {
              editor.groupShapes(editor.getSelectedShapeIds())
            }
            break

          case ']': // Bring to front
            e.preventDefault()
            if (e.shiftKey) {
              editor.bringToFront(editor.getSelectedShapeIds())
            } else {
              editor.bringForward(editor.getSelectedShapeIds())
            }
            break

          case '[': // Send to back
            e.preventDefault()
            if (e.shiftKey) {
              editor.sendToBack(editor.getSelectedShapeIds())
            } else {
              editor.sendBackward(editor.getSelectedShapeIds())
            }
            break

          case '=':
          case '+': // Zoom in
            e.preventDefault()
            editor.zoomIn()
            break

          case '-': // Zoom out
            e.preventDefault()
            editor.zoomOut()
            break

          case '0': // Reset zoom
            e.preventDefault()
            editor.resetZoom()
            break

          case '1': // Zoom to fit
            e.preventDefault()
            editor.zoomToFit()
            break
        }
      }

      // Non-modifier shortcuts
      if (!modKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault()
            editor.deleteShapes(editor.getSelectedShapeIds())
            break

          case 'Escape':
            e.preventDefault()
            editor.selectNone()
            editor.setCurrentTool('select')
            break

          case 'v':
          case 'V':
            e.preventDefault()
            editor.setCurrentTool('select')
            break

          case 'r':
          case 'R':
            e.preventDefault()
            editor.setCurrentTool('geo')
            break

          case 't':
          case 'T':
            e.preventDefault()
            editor.setCurrentTool('text')
            break
        }
      }
    }

    // Use capture phase to intercept before browser
    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [editor])

  return null
}
