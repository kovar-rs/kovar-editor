import { useEffect } from 'react'

/**
 * Prevents tldraw from hiding the cursor by observing style changes.
 */
export function CursorFix() {
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement
          if (target.style.cursor === 'none') {
            target.style.cursor = ''
          }
        }
      })
    })

    const canvas = document.querySelector('.tl-canvas')
    if (canvas) {
      observer.observe(canvas, {
        attributes: true,
        attributeFilter: ['style'],
        subtree: true,
      })
    }

    return () => observer.disconnect()
  }, [])

  return null
}
