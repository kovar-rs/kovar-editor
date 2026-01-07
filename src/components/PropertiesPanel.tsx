import { useState } from 'react'
import { useEditor, useValue, STROKE_SIZES } from 'tldraw'
import type { TLShape } from 'tldraw'
import type { KovarMeta } from '../types/kovar'
import { MAIN_FRAME_ID } from '../lib/constants'
import { useDraggable } from '../hooks/useDraggable'
import { Select } from './Select'

type TLShapeWithKovarMeta = TLShape & { meta: Partial<KovarMeta> }

const GEO_TYPE_OPTIONS = [
  { value: 'container', label: 'div' },
  { value: 'button', label: 'button' },
  { value: 'canvas', label: 'canvas' },
]

/**
 * Maps tldraw shape type to display name.
 */
function getTypeLabel(type: string): string {
  switch (type) {
    case 'geo':
    case 'frame':
      return 'div'
    case 'text':
      return 'text'
    case 'image':
      return 'image'
    default:
      return type
  }
}

/**
 * Right-side panel for editing Kovar binding metadata on selected shapes.
 * Supports drag-to-move and collapse.
 */
export function PropertiesPanel() {
  const editor = useEditor()
  const [collapsed, setCollapsed] = useState(false)

  const { position, handleMouseDown } = useDraggable({
    initialPosition: { x: window.innerWidth - 260, y: 12 },
    storageKey: 'kovar:properties-panel-pos',
  })

  const selectedShapes = useValue(
    'selected shapes',
    () => editor.getSelectedShapes().filter(
      (s) => s.id !== `shape:${MAIN_FRAME_ID}`
    ) as TLShapeWithKovarMeta[],
    [editor]
  )

  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null

  const updateMeta = (key: keyof KovarMeta, value: string | boolean | number) => {
    if (!selectedShape) return

    const currentMeta = selectedShape.meta || {}
    const newMeta: Record<string, string | boolean | number> = {}

    if (currentMeta.kovar_id) newMeta.kovar_id = currentMeta.kovar_id
    if (currentMeta.visibility_binding) newMeta.visibility_binding = currentMeta.visibility_binding
    if (currentMeta.is_display) newMeta.is_display = currentMeta.is_display
    if (currentMeta.component_type) newMeta.component_type = currentMeta.component_type
    if (currentMeta.border_width) newMeta.border_width = currentMeta.border_width

    if (value !== '' && value !== false && value !== 0) {
      newMeta[key] = value
    } else {
      delete newMeta[key]
    }

    editor.updateShapes([
      {
        id: selectedShape.id,
        type: selectedShape.type,
        meta: newMeta,
      },
    ])
  }

  const updateProps = (updates: Partial<Record<string, unknown>>) => {
    if (!selectedShape) return
    editor.updateShapes([
      {
        id: selectedShape.id,
        type: selectedShape.type,
        props: updates,
      },
    ])
  }

  const updatePosition = (axis: 'x' | 'y', value: number) => {
    if (!selectedShape) return
    editor.updateShapes([
      {
        id: selectedShape.id,
        type: selectedShape.type,
        [axis]: value,
      },
    ])
  }

  const meta = selectedShape?.meta || {}
  const props = (selectedShape?.props || {}) as Record<string, unknown>

  return (
    <div
      style={{
        ...styles.panel,
        left: position.x,
        top: position.y,
        right: 'auto',
      }}
    >
      <div
        style={styles.header}
        onMouseDown={handleMouseDown}
      >
        <span>属性</span>
        <button
          style={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {collapsed ? '+' : '-'}
        </button>
      </div>

      {!collapsed && (
        <>
          {!selectedShape ? (
            <div style={styles.empty}>
              {selectedShapes.length === 0 ? '选择一个组件' : '只能编辑单个组件'}
            </div>
          ) : (
            <>
              {/* Type info / selector */}
              <div style={styles.section}>
                <div style={styles.label}>类型</div>
                {selectedShape.type === 'geo' ? (
                  <Select
                    value={(meta.component_type as string) || 'container'}
                    options={GEO_TYPE_OPTIONS}
                    onChange={(v) => updateMeta('component_type', v === 'container' ? '' : v)}
                  />
                ) : (
                  <div style={styles.value}>{getTypeLabel(selectedShape.type)}</div>
                )}
              </div>

              {/* Kovar ID */}
              <div style={styles.section}>
                <label style={styles.label} htmlFor="kovar-id">
                  Kovar ID
                </label>
                <input
                  id="kovar-id"
                  type="text"
                  placeholder="btn_submit"
                  value={(meta.kovar_id as string) || ''}
                  onChange={(e) => updateMeta('kovar_id', e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={styles.input}
                />
              </div>

              {/* Display checkbox for text type */}
              {selectedShape.type === 'text' && (
                <div style={styles.section}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!meta.is_display}
                      onChange={(e) => updateMeta('is_display', e.target.checked)}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={styles.checkbox}
                    />
                    <span>动态显示 (k-display)</span>
                  </label>
                </div>
              )}

              {/* Visibility binding */}
              <div style={styles.section}>
                <label style={styles.label} htmlFor="visibility-binding">
                  可见性绑定
                </label>
                <input
                  id="visibility-binding"
                  type="text"
                  placeholder="is_visible"
                  value={(meta.visibility_binding as string) || ''}
                  onChange={(e) => updateMeta('visibility_binding', e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={styles.input}
                />
              </div>

              {/* Style section */}
              <div style={styles.sectionHeader}>样式</div>

              {/* Position */}
              <div style={styles.section}>
                <div style={styles.label}>位置</div>
                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <span style={styles.inputLabel}>X</span>
                    <input
                      type="number"
                      value={Math.round(selectedShape.x)}
                      onChange={(e) => updatePosition('x', parseFloat(e.target.value) || 0)}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={styles.numberInput}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <span style={styles.inputLabel}>Y</span>
                    <input
                      type="number"
                      value={Math.round(selectedShape.y)}
                      onChange={(e) => updatePosition('y', parseFloat(e.target.value) || 0)}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={styles.numberInput}
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              {props.w !== undefined && (
                <div style={styles.section}>
                  <div style={styles.label}>大小</div>
                  <div style={styles.row}>
                    <div style={styles.inputGroup}>
                      <span style={styles.inputLabel}>W</span>
                      <input
                        type="number"
                        value={Math.round(props.w as number)}
                        onChange={(e) => updateProps({ w: parseFloat(e.target.value) || 0 })}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={styles.numberInput}
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <span style={styles.inputLabel}>H</span>
                      <input
                        type="number"
                        value={Math.round(props.h as number)}
                        onChange={(e) => updateProps({ h: parseFloat(e.target.value) || 0 })}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={styles.numberInput}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Color (for geo/text) */}
              {props.color !== undefined && (
                <div style={styles.section}>
                  <div style={styles.label}>颜色</div>
                  <div style={styles.colorRow}>
                    {['black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue', 'yellow', 'orange', 'green', 'light-green', 'light-red', 'red'].map((color) => (
                      <button
                        key={color}
                        style={{
                          ...styles.colorBtn,
                          backgroundColor: getColorHex(color),
                          border: props.color === color ? '2px solid #333' : '1px solid #ddd',
                        }}
                        onClick={() => updateProps({ color })}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fill (for geo) */}
              {props.fill !== undefined && (
                <div style={styles.section}>
                  <div style={styles.label}>填充</div>
                  <div style={styles.row}>
                    {['none', 'semi', 'solid', 'pattern'].map((fill) => (
                      <button
                        key={fill}
                        style={{
                          ...styles.fillBtn,
                          backgroundColor: props.fill === fill ? '#e0e0e0' : 'transparent',
                        }}
                        onClick={() => updateProps({ fill })}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {fill === 'none' ? '无' : fill === 'semi' ? '半透' : fill === 'solid' ? '实心' : '图案'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dash (for geo) */}
              {props.dash !== undefined && (
                <div style={styles.section}>
                  <div style={styles.label}>边框样式</div>
                  <div style={styles.row}>
                    {['draw', 'solid', 'dashed', 'dotted'].map((dash) => (
                      <button
                        key={dash}
                        style={{
                          ...styles.fillBtn,
                          backgroundColor: props.dash === dash ? '#e0e0e0' : 'transparent',
                        }}
                        onClick={() => updateProps({ dash })}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {dash === 'draw' ? '手绘' : dash === 'solid' ? '实线' : dash === 'dashed' ? '虚线' : '点线'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Border width (for geo) */}
              {selectedShape.type === 'geo' && (
                <div style={styles.section}>
                  <div style={styles.label}>
                    边框粗细 ({(meta.border_width as number) || 1}px)
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={(meta.border_width as number) || 1}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value)
                      // Dynamically update STROKE_SIZES.m to reflect the new width
                      STROKE_SIZES.m = newWidth
                      // Update meta and force re-render by touching the shape
                      updateMeta('border_width', newWidth)
                      // Ensure shape uses 'm' size
                      if (props.size !== 'm') {
                        updateProps({ size: 'm' })
                      }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={styles.slider}
                  />
                </div>
              )}

              {/* Opacity */}
              <div style={styles.section}>
                <div style={styles.label}>透明度</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedShape.opacity}
                  onChange={(e) => {
                    editor.updateShapes([
                      {
                        id: selectedShape.id,
                        type: selectedShape.type,
                        opacity: parseFloat(e.target.value),
                      },
                    ])
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={styles.slider}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Converts tldraw color names to hex values.
 */
function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    black: '#1d1d1d',
    grey: '#9ca3af',
    'light-violet': '#c4b5fd',
    violet: '#8b5cf6',
    blue: '#3b82f6',
    'light-blue': '#7dd3fc',
    yellow: '#fbbf24',
    orange: '#f97316',
    green: '#22c55e',
    'light-green': '#bef264',
    'light-red': '#fca5a5',
    red: '#ef4444',
  }
  return colors[color] || '#1d1d1d'
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    width: 220,
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 9999,
    pointerEvents: 'all',
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.08)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    padding: '10px 12px',
    fontWeight: 600,
    fontSize: 13,
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(250,250,250,0.8)',
    cursor: 'grab',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    userSelect: 'none',
  },
  collapseBtn: {
    width: 20,
    height: 20,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  sectionHeader: {
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 600,
    color: '#666',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  },
  section: {
    padding: '8px 12px',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: '4px 6px',
    borderRadius: 4,
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 12,
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 5,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'white',
  },
  empty: {
    padding: '20px 12px',
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#333',
    cursor: 'pointer',
  },
  checkbox: {
    width: 14,
    height: 14,
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    gap: 8,
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    color: '#999',
    width: 12,
  },
  numberInput: {
    flex: 1,
    width: '100%',
    padding: '4px 6px',
    fontSize: 11,
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 4,
    outline: 'none',
    boxSizing: 'border-box',
  },
  colorRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorBtn: {
    width: 20,
    height: 20,
    borderRadius: 4,
    cursor: 'pointer',
    padding: 0,
  },
  fillBtn: {
    flex: 1,
    padding: '4px 6px',
    fontSize: 10,
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
}
