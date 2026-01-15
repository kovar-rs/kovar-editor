import { useTranslation } from 'react-i18next'
import { useEditor, useValue } from 'tldraw'
import type { TLShape } from 'tldraw'
import type { KovarMeta } from '../../types/kovar'
import { Select } from '../Select'

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
 * Properties tab showing binding-related attributes.
 */
export function PropertiesTab() {
  const { t } = useTranslation()
  const editor = useEditor()

  const selectedShapes = useValue(
    'selected shapes',
    () => editor.getSelectedShapes().filter((s) => {
      // Exclude Main Window frame
      if (s.type === 'frame' && s.meta.is_main_window === true) {
        return false
      }
      return true
    }) as TLShapeWithKovarMeta[],
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

  const meta = selectedShape?.meta || {}

  if (!selectedShape) {
    return (
      <div style={styles.empty}>
        {selectedShapes.length === 0 ? t('props.selectOne') : t('props.singleOnly')}
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Type info / selector */}
      <div style={styles.section}>
        <div style={styles.label}>{t('props.type')}</div>
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
              style={styles.checkbox}
            />
            <span>{t('props.dynamicDisplay')}</span>
          </label>
        </div>
      )}

      {/* Visibility binding */}
      <div style={styles.section}>
        <label style={styles.label} htmlFor="visibility-binding">
          {t('props.visibilityBinding')}
        </label>
        <input
          id="visibility-binding"
          type="text"
          placeholder="is_visible"
          value={(meta.visibility_binding as string) || ''}
          onChange={(e) => updateMeta('visibility_binding', e.target.value)}
          style={styles.input}
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
  value: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: '6px 8px',
    borderRadius: 4,
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 12,
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'white',
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
}
