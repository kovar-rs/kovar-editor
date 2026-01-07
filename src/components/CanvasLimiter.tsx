import { useEffect, useCallback } from 'react'
import { useEditor, createShapeId } from 'tldraw'
import { getCanvasConfig, MAIN_FRAME_ID } from '../lib/constants'

/**
 * Initializes the main design frame and constrains camera movement.
 * Frame auto-resizes to fit browser window.
 */
export function CanvasLimiter() {
  const editor = useEditor()

  const updateFrame = useCallback(() => {
    if (!editor) return

    const config = getCanvasConfig()
    const frameId = createShapeId(MAIN_FRAME_ID)
    const existingFrame = editor.getShape(frameId)

    if (existingFrame) {
      editor.updateShapes([
        {
          id: frameId,
          type: 'frame',
          props: {
            w: config.width,
            h: config.height,
          },
        },
      ])
    } else {
      editor.createShapes([
        {
          id: frameId,
          type: 'frame',
          x: 0,
          y: 0,
          props: {
            w: config.width,
            h: config.height,
            name: config.name,
          },
        },
      ])
    }

    const padding = 50
    editor.setCameraOptions({
      constraints: {
        bounds: {
          x: -padding,
          y: -padding,
          w: config.width + padding * 2,
          h: config.height + padding * 2,
        },
        padding: { x: padding, y: padding },
        origin: { x: 0.5, y: 0.5 },
        initialZoom: 'fit-max',
        baseZoom: 'fit-max',
        behavior: 'contain',
      },
    })

    editor.zoomToBounds(
      { x: 0, y: 0, w: config.width, h: config.height },
      { animation: { duration: 200 } }
    )
  }, [editor])

  useEffect(() => {
    updateFrame()

    const handleResize = () => {
      updateFrame()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateFrame])

  return null
}
