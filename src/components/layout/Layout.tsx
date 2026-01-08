import { useState, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ResizeHandle } from './ResizeHandle'
import { LayoutContext, useLayoutPortals } from '../../hooks/useLayoutPortals'
import { LAYOUT_DIMENSIONS } from '../../lib/layoutDimensions'

const MIN_PANEL_WIDTH = 180
const MAX_PANEL_WIDTH = 400

interface LayoutProps {
  children: ReactNode
}

/**
 * Layout with panels overlaying the canvas.
 * Tldraw fills the entire window, panels are fixed positioned on top.
 */
export function Layout({ children }: LayoutProps) {
  const [topBarRef, setTopBarRef] = useState<HTMLDivElement | null>(null)
  const [leftPanelRef, setLeftPanelRef] = useState<HTMLDivElement | null>(null)
  const [rightPanelRef, setRightPanelRef] = useState<HTMLDivElement | null>(null)

  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('kovar:left-panel-width')
    return saved ? parseInt(saved) : LAYOUT_DIMENSIONS.defaultLeftWidth
  })

  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('kovar:right-panel-width')
    return saved ? parseInt(saved) : LAYOUT_DIMENSIONS.defaultRightWidth
  })

  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth((w) => {
      const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, w + delta))
      localStorage.setItem('kovar:left-panel-width', String(newWidth))
      return newWidth
    })
  }, [])

  const handleRightResize = useCallback((delta: number) => {
    setRightWidth((w) => {
      const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, w - delta))
      localStorage.setItem('kovar:right-panel-width', String(newWidth))
      return newWidth
    })
  }, [])

  const handleLeftDoubleClick = useCallback(() => {
    setLeftWidth(LAYOUT_DIMENSIONS.defaultLeftWidth)
    localStorage.setItem('kovar:left-panel-width', String(LAYOUT_DIMENSIONS.defaultLeftWidth))
  }, [])

  const handleRightDoubleClick = useCallback(() => {
    setRightWidth(LAYOUT_DIMENSIONS.defaultRightWidth)
    localStorage.setItem('kovar:right-panel-width', String(LAYOUT_DIMENSIONS.defaultRightWidth))
  }, [])

  return (
    <LayoutContext.Provider value={{ topBarRef, leftPanelRef, rightPanelRef }}>
      {/* Top bar - fixed at top */}
      <div ref={setTopBarRef} style={styles.topBar} />

      {/* Left panel - fixed at left */}
      <div style={{ ...styles.leftPanel, width: leftWidth }}>
        <div ref={setLeftPanelRef} style={styles.panelContent} />
      </div>
      <div style={{ ...styles.leftResizeHandle, left: leftWidth }}>
        <ResizeHandle onResize={handleLeftResize} onDoubleClick={handleLeftDoubleClick} />
      </div>

      {/* Tldraw canvas - fills center area between panels */}
      <div
        style={{
          position: 'fixed',
          top: LAYOUT_DIMENSIONS.topBarHeight,
          left: leftWidth,
          right: rightWidth,
          bottom: 0,
          zIndex: 0,
        }}
      >
        {children}
      </div>

      {/* Right panel - fixed at right */}
      <div style={{ ...styles.rightPanel, width: rightWidth }}>
        <div ref={setRightPanelRef} style={styles.panelContent} />
      </div>
      <div style={{ ...styles.rightResizeHandle, right: rightWidth }}>
        <ResizeHandle onResize={handleRightResize} onDoubleClick={handleRightDoubleClick} />
      </div>
    </LayoutContext.Provider>
  )
}

/**
 * Portal component to render content into top bar slot.
 */
export function TopBarPortal({ children }: { children: ReactNode }) {
  const { topBarRef } = useLayoutPortals()
  if (!topBarRef) return null
  return createPortal(children, topBarRef)
}

/**
 * Portal component to render content into left panel slot.
 */
export function LeftPanelPortal({ children }: { children: ReactNode }) {
  const { leftPanelRef } = useLayoutPortals()
  if (!leftPanelRef) return null
  return createPortal(children, leftPanelRef)
}

/**
 * Portal component to render content into right panel slot.
 */
export function RightPanelPortal({ children }: { children: ReactNode }) {
  const { rightPanelRef } = useLayoutPortals()
  if (!rightPanelRef) return null
  return createPortal(children, rightPanelRef)
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: LAYOUT_DIMENSIONS.topBarHeight,
    backgroundColor: '#f8f8f8',
    borderBottom: '1px solid #e0e0e0',
    zIndex: 200,
  },
  leftPanel: {
    position: 'fixed',
    top: LAYOUT_DIMENSIONS.topBarHeight,
    left: 0,
    bottom: 0,
    backgroundColor: '#f3f3f3',
    borderRight: '1px solid #e0e0e0',
    zIndex: 100,
    overflow: 'hidden',
  },
  leftResizeHandle: {
    position: 'fixed',
    top: LAYOUT_DIMENSIONS.topBarHeight,
    bottom: 0,
    zIndex: 101,
  },
  rightPanel: {
    position: 'fixed',
    top: LAYOUT_DIMENSIONS.topBarHeight,
    right: 0,
    bottom: 0,
    backgroundColor: '#f3f3f3',
    borderLeft: '1px solid #e0e0e0',
    zIndex: 100,
    overflow: 'hidden',
  },
  rightResizeHandle: {
    position: 'fixed',
    top: LAYOUT_DIMENSIONS.topBarHeight,
    bottom: 0,
    zIndex: 101,
  },
  panelContent: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
  },
}
