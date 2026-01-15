import { useState, useCallback, useEffect } from 'react'

interface ResizeHandleProps {
  onResize: (delta: number) => void
  onDoubleClick: () => void
}

/**
 * Draggable resize handle for panel width adjustment.
 */
export function ResizeHandle({ onResize, onDoubleClick }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    let lastX = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (lastX !== 0) {
        const delta = e.clientX - lastX
        onResize(delta)
      }
      lastX = e.clientX
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      lastX = 0
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onResize])

  return (
    <div
      style={{
        ...styles.handle,
        backgroundColor: isDragging || isHovered ? '#007acc' : 'transparent',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  )
}

const styles: Record<string, React.CSSProperties> = {
  handle: {
    width: 4,
    cursor: 'col-resize',
    transition: 'background-color 0.15s',
    flexShrink: 0,
  },
}
