import { useEffect, useCallback, useRef } from 'react'
import { useEditor } from 'tldraw'

const FRAME_PADDING = 20
const RESIZE_DEBOUNCE_MS = 150

/**
 * Find the Main Window frame by meta.is_main_window flag.
 */
function findMainWindow(editor: ReturnType<typeof useEditor>) {
  const frames = editor.getCurrentPageShapes().filter((s) => s.type === 'frame')
  return frames.find((f) => f.meta.is_main_window === true)
}

/**
 * Zooms camera to fit Main Window in viewport.
 * If no Main Window exists, creates one that fits the current viewport.
 */
export function CanvasLimiter() {
  const editor = useEditor()
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateView = useCallback(() => {
    if (!editor) return

    // Temporarily unlock camera for zooming
    editor.setCameraOptions({ isLocked: false })

    const existingFrame = findMainWindow(editor)

    if (existingFrame) {
      // Main Window exists - zoom camera to fit it (don't resize the frame)
      const bounds = editor.getShapePageBounds(existingFrame)
      if (bounds) {
        editor.zoomToBounds(bounds, {
          animation: { duration: 0 },
          inset: FRAME_PADDING,
        })
      }
    } else {
      // No Main Window - create one that fits current viewport
      const viewportBounds = editor.getViewportScreenBounds()
      const frameWidth = viewportBounds.w - FRAME_PADDING * 2
      const frameHeight = viewportBounds.h - FRAME_PADDING * 2

      editor.createShapes([
        {
          type: 'frame',
          x: 0,
          y: 0,
          isLocked: true,
          meta: { is_main_window: true },
          props: { w: frameWidth, h: frameHeight, name: 'Main Window' },
        },
      ])

      editor.zoomToBounds(
        { x: 0, y: 0, w: frameWidth, h: frameHeight },
        { animation: { duration: 0 }, inset: FRAME_PADDING }
      )
    }

    // Lock camera again
    editor.setCameraOptions({
      isLocked: true,
      wheelBehavior: 'none',
      panSpeed: 0,
      zoomSpeed: 0,
    })
  }, [editor])

  // Debounced resize handler - only fires after resize stops
  const debouncedUpdate = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(updateView, RESIZE_DEBOUNCE_MS)
  }, [updateView])

  useEffect(() => {
    // Initial update with delay to ensure editor is ready
    setTimeout(updateView, 100)

    // Window resize - debounced
    window.addEventListener('resize', debouncedUpdate)

    // Listen for panel width changes via storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('panel-width')) {
        debouncedUpdate()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('resize', debouncedUpdate)
      window.removeEventListener('storage', handleStorage)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [updateView, debouncedUpdate])

  return null
}
