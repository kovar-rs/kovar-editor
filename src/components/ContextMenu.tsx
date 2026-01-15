import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor, useValue, createShapeId, GeoShapeGeoStyle, toRichText } from 'tldraw'
import type { TLShape, TLShapeId, Vec } from 'tldraw'

interface MenuPosition {
  x: number
  y: number
}

type SubmenuType = 'add' | 'reparent' | null

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
 * Checks if a shape is the Main Window frame.
 */
function isMainWindow(shape: TLShape): boolean {
  return shape.type === 'frame' && shape.meta.is_main_window === true
}

/**
 * Context menu for shape operations including reparenting.
 */
export function ContextMenu() {
  const { t } = useTranslation()
  const editor = useEditor()
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const [canvasPoint, setCanvasPoint] = useState<Vec | null>(null)
  const [openSubmenu, setOpenSubmenu] = useState<SubmenuType>(null)
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

  // Get potential parent containers (geo shapes that are not selected)
  const potentialParents = allShapes.filter((shape): shape is TLShape => {
    if (shape.type !== 'geo' && shape.type !== 'frame') return false
    if (isMainWindow(shape)) return false
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
    if (!openSubmenu || !submenuRef.current || !menuRef.current) return

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
    const triggerSelector = openSubmenu === 'add' ? '[data-submenu-add]' : '[data-submenu-reparent]'
    const triggerItem = menuRef.current.querySelector(triggerSelector) as HTMLElement
    let top = triggerItem ? triggerItem.getBoundingClientRect().top : menuRect.top
    top = Math.max(bounds.top + padding, Math.min(top, bounds.bottom - submenuRect.height - padding))

    submenuRef.current.style.left = `${left}px`
    submenuRef.current.style.top = `${top}px`
    submenuRef.current.style.visibility = 'visible'
  }, [openSubmenu])

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      // Always prevent default browser menu within canvas
      e.preventDefault()

      // Store canvas point for adding shapes
      const point = editor.screenToPage({ x: e.clientX, y: e.clientY })
      setCanvasPoint(point)

      setMenuPosition({ x: e.clientX, y: e.clientY })
      setOpenSubmenu(null)
    },
    [editor]
  )

  const closeMenu = useCallback(() => {
    setMenuPosition(null)
    setOpenSubmenu(null)
    setHoveredShapeId(null)
    setCanvasPoint(null)
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
      .filter((s) => !isMainWindow(s))
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.reparentShapes(shapeIds, parentId as TLShape['id'])
    }
    closeMenu()
  }

  const handleUnparent = () => {
    // Find Main Window and reparent to it
    const mainWindow = allShapes.find(isMainWindow)
    if (!mainWindow) return

    const shapeIds = selectedShapes
      .filter((s) => !isMainWindow(s))
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.reparentShapes(shapeIds, mainWindow.id)
    }
    closeMenu()
  }

  const handleDelete = () => {
    const shapeIds = selectedShapes
      .filter((s) => !isMainWindow(s))
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.deleteShapes(shapeIds)
    }
    closeMenu()
  }

  const handleDuplicate = () => {
    const shapeIds = selectedShapes
      .filter((s) => !isMainWindow(s))
      .map((s) => s.id)

    if (shapeIds.length > 0) {
      editor.duplicateShapes(shapeIds, { x: 20, y: 20 })
    }
    closeMenu()
  }

  const handleBringToFront = () => {
    const shapeIds = selectedShapes.filter((s) => !isMainWindow(s)).map((s) => s.id)
    if (shapeIds.length > 0) {
      editor.bringToFront(shapeIds)
    }
    closeMenu()
  }

  const handleSendToBack = () => {
    const shapeIds = selectedShapes.filter((s) => !isMainWindow(s)).map((s) => s.id)
    if (shapeIds.length > 0) {
      editor.sendToBack(shapeIds)
    }
    closeMenu()
  }

  // Add shape handlers
  const handleAddRectangle = () => {
    if (!canvasPoint) return
    const id = createShapeId()
    editor.setStyleForNextShapes(GeoShapeGeoStyle, 'rectangle')
    editor.createShape({
      id,
      type: 'geo',
      x: canvasPoint.x,
      y: canvasPoint.y,
      props: { w: 100, h: 100 },
    })
    editor.select(id)
    closeMenu()
  }

  const handleAddFrame = () => {
    if (!canvasPoint) return
    const id = createShapeId()
    editor.createShape({
      id,
      type: 'frame',
      x: canvasPoint.x,
      y: canvasPoint.y,
      props: { w: 200, h: 150 },
    })
    editor.select(id)
    closeMenu()
  }

  const handleAddText = () => {
    if (!canvasPoint) return
    const id = createShapeId()
    editor.createShape({
      id,
      type: 'text',
      x: canvasPoint.x,
      y: canvasPoint.y,
      props: {
        richText: toRichText('Text'),
      },
    })
    editor.select(id)
    closeMenu()
  }

  const handleAddImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && canvasPoint) {
        const asset = await editor.getAssetForExternalContent({ type: 'file', file })
        if (asset) {
          const id = createShapeId()
          editor.createAssets([asset])
          editor.createShape({
            id,
            type: 'image',
            x: canvasPoint.x,
            y: canvasPoint.y,
            props: { assetId: asset.id, w: 200, h: 200 },
          })
          editor.select(id)
        }
      }
      closeMenu()
    }
    input.click()
  }

  if (!menuPosition) return null

  const validSelection = selectedShapes.filter((s) => !isMainWindow(s))
  const hasSelection = validSelection.length > 0
  const currentParentId = selectedShapes[0]?.parentId

  // Check if parent is Main Window
  const mainWindow = allShapes.find(isMainWindow)
  const hasParent = currentParentId && mainWindow && currentParentId !== mainWindow.id

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
        {/* Add Component submenu - always visible */}
        <div
          data-submenu-add
          style={{ ...styles.menuItem, ...styles.submenuTrigger }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5'
            setOpenSubmenu('add')
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            setTimeout(() => {
              if (!submenuRef.current?.matches(':hover')) {
                setOpenSubmenu(null)
              }
            }, 50)
          }}
        >
          {t('context.addComponent')}
          <span style={styles.arrow}>▶</span>
        </div>

        {openSubmenu === 'add' && (
          <div
            ref={submenuRef}
            style={{ ...styles.submenu, visibility: 'hidden' }}
            onMouseEnter={() => setOpenSubmenu('add')}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <div
              style={styles.menuItem}
              onClick={handleAddRectangle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={styles.menuIcon}>□</span> {t('tool.geo')}
            </div>
            <div
              style={styles.menuItem}
              onClick={handleAddFrame}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={styles.menuIcon}>▢</span> {t('tool.frame')}
            </div>
            <div
              style={styles.menuItem}
              onClick={handleAddText}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={styles.menuIcon}>T</span> {t('tool.text')}
            </div>
            <div
              style={styles.menuItem}
              onClick={handleAddImage}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={styles.menuIcon}>▣</span> {t('tool.image')}
            </div>
          </div>
        )}

        {/* Selection-specific actions */}
        {hasSelection && (
          <>
            <div style={styles.divider} />

            <div
              style={styles.menuItem}
              onClick={handleDuplicate}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {t('context.duplicate')} <span style={styles.shortcut}>⌘D</span>
            </div>
            <div
              style={styles.menuItem}
              onClick={handleDelete}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {t('context.delete')} <span style={styles.shortcut}>⌫</span>
            </div>

            <div style={styles.divider} />

            <div
              style={styles.menuItem}
              onClick={handleBringToFront}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {t('context.bringToFront')} <span style={styles.shortcut}>⌘]</span>
            </div>
            <div
              style={styles.menuItem}
              onClick={handleSendToBack}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {t('context.sendToBack')} <span style={styles.shortcut}>⌘[</span>
            </div>

            <div style={styles.divider} />

            {/* Reparent submenu */}
            <div
              data-submenu-reparent
              style={{ ...styles.menuItem, ...styles.submenuTrigger }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
                setOpenSubmenu('reparent')
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                setTimeout(() => {
                  if (!submenuRef.current?.matches(':hover')) {
                    setOpenSubmenu(null)
                  }
                }, 50)
              }}
            >
              {t('context.setAsChild')}
              <span style={styles.arrow}>▶</span>
            </div>

            {openSubmenu === 'reparent' && (
              <div
                ref={submenuRef}
                style={{ ...styles.submenu, visibility: 'hidden' }}
                onMouseEnter={() => setOpenSubmenu('reparent')}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                {potentialParents.length === 0 ? (
                  <div style={{ ...styles.menuItem, ...styles.disabled }}>
                    {t('context.noContainer')}
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
                {t('context.unnest')}
              </div>
            )}
          </>
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
  menuIcon: {
    marginRight: 8,
    fontSize: 14,
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
