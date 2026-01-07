import { useState, useEffect, useCallback } from 'react'
import { useEditor, useValue, createShapeId } from 'tldraw'
import type { TLShape, TLShapeId } from 'tldraw'
import { MAIN_FRAME_ID } from '../lib/constants'

interface MenuPosition {
  x: number
  y: number
}

/**
 * Context menu for shape operations including reparenting.
 */
export function ContextMenu() {
  const editor = useEditor()
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [hoveredShapeId, setHoveredShapeId] = useState<TLShapeId | null>(null)

  const selectedShapes = useValue(
    'selected shapes for context',
    () => editor.getSelectedShapes(),
    [editor]
  )

  const allShapes = useValue(
    'all shapes',
    () => editor.getCurrentPageShapes(),
    [editor]
  )

  const mainFrameId = `shape:${MAIN_FRAME_ID}`

  // Get potential parent containers (geo shapes that are not selected)
  const potentialParents = allShapes.filter((shape): shape is TLShape => {
    if (shape.type !== 'geo' && shape.type !== 'frame') return false
    if (shape.id === mainFrameId) return false
    // Don't allow selecting self or selected shapes as parent
    if (selectedShapes.some((s) => s.id === shape.id)) return false
    // Don't allow child to become parent of its ancestor
    const selectedIds = new Set(selectedShapes.map((s) => s.id))
    if (selectedIds.has(shape.id)) return false
    return true
  })

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      // Only show menu if we have selected shapes (excluding main frame)
      const validSelection = selectedShapes.filter((s) => s.id !== mainFrameId)
      if (validSelection.length === 0) return

      e.preventDefault()
      setMenuPosition({ x: e.clientX, y: e.clientY })
      setSubmenuOpen(false)
    },
    [selectedShapes, mainFrameId]
  )

  const closeMenu = useCallback(() => {
    setMenuPosition(null)
    setSubmenuOpen(false)
    setHoveredShapeId(null)
    editor.setHintingShapes([])
  }, [editor])

  // Highlight shape on hover
  const handleShapeHover = useCallback((shapeId: TLShapeId | null) => {
    setHoveredShapeId(shapeId)
    if (shapeId) {
      editor.setHintingShapes([shapeId])
    } else {
      editor.setHintingShapes([])
    }
  }, [editor])

  // Listen for right-click
  useEffect(() => {
    const container = document.querySelector('.tl-container')
    if (!container) return

    container.addEventListener('contextmenu', handleContextMenu as EventListener)
    document.addEventListener('click', closeMenu)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu()
    })

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu as EventListener)
      document.removeEventListener('click', closeMenu)
    }
  }, [handleContextMenu, closeMenu])

  const handleReparent = (parentId: string) => {
    const shapeIds = selectedShapes
      .filter((s) => s.id !== mainFrameId)
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.reparentShapes(shapeIds, parentId as TLShape['id'])
    }
    closeMenu()
  }

  const handleUnparent = () => {
    const shapeIds = selectedShapes
      .filter((s) => s.id !== mainFrameId)
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.reparentShapes(shapeIds, createShapeId(MAIN_FRAME_ID))
    }
    closeMenu()
  }

  const handleDelete = () => {
    const shapeIds = selectedShapes
      .filter((s) => s.id !== mainFrameId)
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.deleteShapes(shapeIds)
    }
    closeMenu()
  }

  const handleDuplicate = () => {
    const shapeIds = selectedShapes
      .filter((s) => s.id !== mainFrameId)
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.duplicateShapes(shapeIds, { x: 20, y: 20 })
    }
    closeMenu()
  }

  const handleBringToFront = () => {
    const shapeIds = selectedShapes.filter((s) => s.id !== mainFrameId).map((s) => s.id)
    if (shapeIds.length > 0) {
      editor.bringToFront(shapeIds)
    }
    closeMenu()
  }

  const handleSendToBack = () => {
    const shapeIds = selectedShapes.filter((s) => s.id !== mainFrameId).map((s) => s.id)
    if (shapeIds.length > 0) {
      editor.sendToBack(shapeIds)
    }
    closeMenu()
  }

  if (!menuPosition) return null

  const currentParentId = selectedShapes[0]?.parentId
  const hasParent = currentParentId && currentParentId !== mainFrameId

  return (
    <>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={closeMenu} onContextMenu={(e) => e.preventDefault()} />

      {/* Menu */}
      <div
        style={{
          ...styles.menu,
          left: menuPosition.x,
          top: menuPosition.y,
        }}
      >
        <div
          style={styles.menuItem}
          onClick={handleDuplicate}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          复制 <span style={styles.shortcut}>⌘D</span>
        </div>
        <div
          style={styles.menuItem}
          onClick={handleDelete}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          删除 <span style={styles.shortcut}>⌫</span>
        </div>

        <div style={styles.divider} />

        <div
          style={styles.menuItem}
          onClick={handleBringToFront}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          置于顶层 <span style={styles.shortcut}>⌘]</span>
        </div>
        <div
          style={styles.menuItem}
          onClick={handleSendToBack}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          置于底层 <span style={styles.shortcut}>⌘[</span>
        </div>

        <div style={styles.divider} />

        {/* Reparent submenu */}
        <div
          style={{ ...styles.menuItem, ...styles.submenuTrigger }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5'
            setSubmenuOpen(true)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            setSubmenuOpen(false)
          }}
        >
          设为子组件...
          <span style={styles.arrow}>▶</span>

          {submenuOpen && (
            <>
              {/* Bridge to prevent gap issues */}
              <div style={styles.submenuBridge} />
              <div
                style={styles.submenu}
                onMouseEnter={() => setSubmenuOpen(true)}
                onMouseLeave={() => setSubmenuOpen(false)}
              >
                {potentialParents.length === 0 ? (
                  <div style={{ ...styles.menuItem, ...styles.disabled }}>
                    无可用容器
                  </div>
                ) : (
                  potentialParents.map((shape) => {
                    const meta = shape.meta as Record<string, string> | undefined
                    const label = meta?.kovar_id || shape.id.replace('shape:', '')
                    const isHovered = hoveredShapeId === shape.id
                    return (
                      <div
                        key={shape.id}
                        style={{
                          ...styles.menuItem,
                          backgroundColor: isHovered ? '#e8f4fc' : 'transparent',
                        }}
                        onClick={() => handleReparent(shape.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e8f4fc'
                          handleShapeHover(shape.id as TLShapeId)
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          handleShapeHover(null)
                        }}
                      >
                        {label}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>

        {hasParent && (
          <div
            style={styles.menuItem}
            onClick={handleUnparent}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            取消嵌套
          </div>
        )}
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 99998,
  },
  menu: {
    position: 'fixed',
    zIndex: 99999,
    backgroundColor: 'white',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    padding: '4px 0',
    minWidth: 180,
    pointerEvents: 'all',
  },
  menuItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    transition: 'background-color 0.1s',
  },
  disabled: {
    color: '#999',
    cursor: 'default',
  },
  shortcut: {
    color: '#999',
    fontSize: 11,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    margin: '4px 0',
  },
  submenuTrigger: {
    position: 'relative',
  },
  arrow: {
    fontSize: 10,
    color: '#666',
  },
  submenuBridge: {
    position: 'absolute',
    left: '100%',
    top: 0,
    width: 12,
    height: '100%',
  },
  submenu: {
    position: 'absolute',
    left: '100%',
    top: -4,
    backgroundColor: 'white',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    padding: '4px 0',
    minWidth: 150,
    marginLeft: 8,
  },
}
