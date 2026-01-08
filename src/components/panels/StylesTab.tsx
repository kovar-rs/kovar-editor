import { useEditor, useValue, STROKE_SIZES } from 'tldraw'
import type { TLShape } from 'tldraw'
import type { KovarMeta } from '../../types/kovar'
import { MAIN_FRAME_ID } from '../../lib/constants'

type TLShapeWithKovarMeta = TLShape & { meta: Partial<KovarMeta> }

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

/**
 * Styles tab showing visual properties.
 */
export function StylesTab() {
  const editor = useEditor()

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

    editor.updateShapes([
      {
        id: selectedShape.id,
        type: selectedShape.type,
        meta: {
          ...selectedShape.meta,
          [key]: value,
        },
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

  if (!selectedShape) {
    return (
      <div style={styles.empty}>
        {selectedShapes.length === 0 ? '选择一个组件' : '只能编辑单个组件'}
      </div>
    )
  }

  return (
    <div style={styles.container}>
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
              style={styles.numberInput}
            />
          </div>
          <div style={styles.inputGroup}>
            <span style={styles.inputLabel}>Y</span>
            <input
              type="number"
              value={Math.round(selectedShape.y)}
              onChange={(e) => updatePosition('y', parseFloat(e.target.value) || 0)}
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
                style={styles.numberInput}
              />
            </div>
            <div style={styles.inputGroup}>
              <span style={styles.inputLabel}>H</span>
              <input
                type="number"
                value={Math.round(props.h as number)}
                onChange={(e) => updateProps({ h: parseFloat(e.target.value) || 0 })}
                style={styles.numberInput}
              />
            </div>
          </div>
        </div>
      )}

      {/* Color */}
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
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fill */}
      {props.fill !== undefined && (
        <div style={styles.section}>
          <div style={styles.label}>填充</div>
          <div style={styles.row}>
            {['none', 'semi', 'solid', 'pattern'].map((fill) => (
              <button
                key={fill}
                style={{
                  ...styles.optionBtn,
                  backgroundColor: props.fill === fill ? '#e8e8e8' : 'transparent',
                }}
                onClick={() => updateProps({ fill })}
              >
                {fill === 'none' ? '无' : fill === 'semi' ? '半透' : fill === 'solid' ? '实心' : '图案'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dash */}
      {props.dash !== undefined && (
        <div style={styles.section}>
          <div style={styles.label}>边框样式</div>
          <div style={styles.row}>
            {['draw', 'solid', 'dashed', 'dotted'].map((dash) => (
              <button
                key={dash}
                style={{
                  ...styles.optionBtn,
                  backgroundColor: props.dash === dash ? '#e8e8e8' : 'transparent',
                }}
                onClick={() => updateProps({ dash })}
              >
                {dash === 'draw' ? '手绘' : dash === 'solid' ? '实线' : dash === 'dashed' ? '虚线' : '点线'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Border width */}
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
              STROKE_SIZES.m = newWidth
              updateMeta('border_width', newWidth)
              if (props.size !== 'm') {
                updateProps({ size: 'm' })
              }
            }}
            style={styles.slider}
          />
        </div>
      )}

      {/* Opacity */}
      <div style={styles.section}>
        <div style={styles.label}>透明度 ({Math.round(selectedShape.opacity * 100)}%)</div>
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
          style={styles.slider}
        />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 12,
  },
  empty: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: '#666',
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    gap: 6,
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
    width: 14,
  },
  numberInput: {
    flex: 1,
    width: '100%',
    padding: '5px 6px',
    fontSize: 11,
    border: '1px solid #e0e0e0',
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
  optionBtn: {
    flex: 1,
    padding: '5px 4px',
    fontSize: 10,
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
}
