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
          console.log('Loaded existing .tldr file')
        }
      } catch (e) {
        console.error('Failed to load .tldr:', e)
      }
    }

    load()
  }, [editor])
}
