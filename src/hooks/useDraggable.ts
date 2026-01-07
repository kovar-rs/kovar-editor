import { useState, useCallback, useRef, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  initialPosition: Position
  storageKey?: string
}

/**
 * Hook for making a panel draggable with position persistence.
 */
export function useDraggable({ initialPosition, storageKey }: UseDraggableOptions) {
  const [position, setPosition] = useState<Position>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // ignore
        }
      }
    }
    return initialPosition
  })

  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, select, button, textarea')) {
      return
    }
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    e.preventDefault()
  }, [position])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.current.x))
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y))

      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      if (isDragging.current && storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(position))
      }
      isDragging.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [position, storageKey])

  return { position, handleMouseDown }
}
