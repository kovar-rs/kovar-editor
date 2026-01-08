import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { useEditor, useValue, createShapeId } from 'tldraw'
import type { TLShape, TLShapeId } from 'tldraw'
import { MAIN_FRAME_ID } from '../lib/constants'

interface MenuPosition {
  x: number
  y: number
}

/**
 * Gets the canvas container bounds for boundary calculations.
 */
function getCanvasBounds(): DOMRect | null {
  const container = document.querySelector('.tl-container')
  return container?.getBoundingClientRect() || null
}

/**
 * Adjusts position to keep element within the canvas container bounds.
 */
function adjustPosition(
  pos: MenuPosition,
  menuWidth: number,
  menuHeight: number
): MenuPosition {
  const padding = 8
  const bounds = getCanvasBounds()
  if (!bounds) return pos

  const minX = bounds.left + padding
  const minY = bounds.top + padding
  const maxX = bounds.right - menuWidth - padding
  const maxY = bounds.bottom - menuHeight - padding

  return {
    x: Math.max(minX, Math.min(pos.x, maxX)),
    y: Math.max(minY, Math.min(pos.y, maxY)),
  }
}

/**
 * Context menu for shape operations including reparenting.
 */
export function ContextMenu() {
  const editor = useEditor()
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [hoveredShapeId, setHoveredShapeId] = useState<TLShapeId | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)

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

  // Adjust menu position after render to fit within viewport
  useLayoutEffect(() => {
    if (!menuPosition || !menuRef.current) return

    const rect = menuRef.current.getBoundingClientRect()
    const adjusted = adjustPosition(menuPosition, rect.width, rect.height)

    menuRef.current.style.left = `${adjusted.x}px`
    menuRef.current.style.top = `${adjusted.y}px`
    menuRef.current.style.visibility = 'visible'
  }, [menuPosition])

  // Adjust submenu position after render to fit within canvas bounds
  useLayoutEffect(() => {
    if (!submenuOpen || !submenuRef.current || !menuRef.current) return

    const bounds = getCanvasBounds()
    if (!bounds) return

    const menuRect = menuRef.current.getBoundingClientRect()
    const submenuRect = submenuRef.current.getBoundingClientRect()
    const padding = 8

    // Calculate available space on left and right
    const spaceRight = bounds.right - menuRect.right - padding
    const spaceLeft = menuRect.left - bounds.left - padding

    // Decide direction based on available space
    const openLeft = spaceRight < submenuRect.width && spaceLeft > spaceRight

    // Calculate horizontal position
    let left: number
    if (openLeft) {
      left = menuRect.left - submenuRect.width - 8
    } else {
      left = menuRect.right + 8
    }

    // Constrain to canvas bounds
    left = Math.max(bounds.left + padding, Math.min(left, bounds.right - submenuRect.width - padding))

    // Calculate vertical position - align with trigger item, constrain to bounds
    const triggerItem = menuRef.current.querySelector('[data-submenu-trigger]') as HTMLElement
    let top = triggerItem ? triggerItem.getBoundingClientRect().top : menuRect.top
    top = Math.max(bounds.top + padding, Math.min(top, bounds.bottom - submenuRect.height - padding))

    submenuRef.current.style.left = `${left}px`
    submenuRef.current.style.top = `${top}px`
    submenuRef.current.style.visibility = 'visible'
  }, [submenuOpen])

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
        ref={menuRef}
        style={{
          ...styles.menu,
          left: menuPosition.x,
          top: menuPosition.y,
          visibility: 'hidden',
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
          data-submenu-trigger
          style={{ ...styles.menuItem, ...styles.submenuTrigger }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5'
            setSubmenuOpen(true)
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            // Only close if mouse didn't move to submenu
            setTimeout(() => {
              if (!submenuRef.current?.matches(':hover')) {
                setSubmenuOpen(false)
              }
            }, 50)
          }}
        >
          设为子组件...
          <span style={styles.arrow}>▶</span>
        </div>

        {submenuOpen && (
          <div
            ref={submenuRef}
            style={{
              ...styles.submenu,
              visibility: 'hidden',
            }}
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
        )}

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
  submenu: {
    position: 'fixed',
    zIndex: 100000,
    backgroundColor: 'white',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    padding: '4px 0',
    minWidth: 150,
  },
}
