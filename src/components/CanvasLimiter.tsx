import { useEffect, useCallback } from 'react'
import { useEditor } from 'tldraw'

const FRAME_PADDING = 20

/**
 * Find the Main Window frame by meta.is_main_window flag.
 */
function findMainWindow(editor: ReturnType<typeof useEditor>) {
  const frames = editor.getCurrentPageShapes().filter((s) => s.type === 'frame')
  return frames.find((f) => f.meta.is_main_window === true)
}

/**
 * Initializes the main design frame to fill the tldraw viewport with padding.
 * Frame is locked and camera zooms to fit it.
 */
export function CanvasLimiter() {
  const editor = useEditor()

  const updateFrame = useCallback(() => {
    if (!editor) return

    // Get the viewport bounds (now tldraw only fills the center area)
    const viewportBounds = editor.getViewportScreenBounds()

    // Frame slightly smaller than viewport so borders are visible
    const frameWidth = viewportBounds.w - FRAME_PADDING * 2
    const frameHeight = viewportBounds.h - FRAME_PADDING * 2

    // Frame at origin
    const frameX = 0
    const frameY = 0

    const existingFrame = findMainWindow(editor)

    if (existingFrame) {
      editor.updateShapes([
        {
          id: existingFrame.id,
          type: 'frame',
          x: frameX,
          y: frameY,
          isLocked: true,
          props: { w: frameWidth, h: frameHeight },
        },
      ])
    } else {
      // Create with random ID, mark with meta
      editor.createShapes([
        {
          type: 'frame',
          x: frameX,
          y: frameY,
          isLocked: true,
          meta: { is_main_window: true },
          props: { w: frameWidth, h: frameHeight, name: 'Main Window' },
        },
      ])
    }

    // Zoom to fit the frame with some padding
    editor.zoomToBounds(
      { x: frameX, y: frameY, w: frameWidth, h: frameHeight },
      { animation: { duration: 0 }, inset: FRAME_PADDING }
    )

    // Lock camera
    editor.setCameraOptions({
      isLocked: true,
      wheelBehavior: 'none',
      panSpeed: 0,
      zoomSpeed: 0,
    })
  }, [editor])

  useEffect(() => {
    // Initial update with delay to ensure editor is ready
    setTimeout(updateFrame, 100)

    // Window resize
    window.addEventListener('resize', updateFrame)

    // Listen for panel width changes via storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('panel-width')) {
        setTimeout(updateFrame, 50)
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('resize', updateFrame)
      window.removeEventListener('storage', handleStorage)
    }
  }, [updateFrame])

  return null
}
