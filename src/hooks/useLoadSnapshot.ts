import { useEffect } from 'react'
import { useEditor } from 'tldraw'
import { loadTldr } from '../lib/api'

/**
 * Load existing .tldr snapshot on editor mount.
 */
export function useLoadSnapshot() {
  const editor = useEditor()

  useEffect(() => {
    async function load() {
      try {
        const snapshot = await loadTldr()
        if (snapshot) {
          editor.loadSnapshot(snapshot)
          // Fit Main Window to viewport regardless of saved camera position
          requestAnimationFrame(() => {
            // Find Main Window shape and zoom to it
            const mainWindow = editor.getCurrentPageShapes().find(
              (s) => s.meta?.is_main_window === true
            )
            if (mainWindow) {
              const bounds = editor.getShapePageBounds(mainWindow)
              if (bounds) {
                editor.zoomToBounds(bounds, {
                  inset: 32,
                  animation: { duration: 0 },
                })
              }
            } else {
              editor.zoomToFit({ animation: { duration: 0 } })
            }
          })
          console.log('Loaded existing .tldr file')
        }
      } catch (e) {
        console.error('Failed to load .tldr:', e)
      }
    }

    load()
  }, [editor])
}
