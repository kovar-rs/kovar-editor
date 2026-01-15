import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor, useValue, GeoShapeGeoStyle } from 'tldraw'

interface ComponentItem {
  id: string
  labelKey: string
  icon: string
  action: 'tool' | 'upload'
  tool?: string
}

const COMPONENTS: ComponentItem[] = [
  { id: 'select', labelKey: 'tool.select', icon: '↖', action: 'tool', tool: 'select' },
  { id: 'geo', labelKey: 'tool.geo', icon: '□', action: 'tool', tool: 'geo' },
  { id: 'frame', labelKey: 'tool.frame', icon: '▢', action: 'tool', tool: 'frame' },
  { id: 'text', labelKey: 'tool.text', icon: 'T', action: 'tool', tool: 'text' },
  { id: 'image', labelKey: 'tool.image', icon: '▣', action: 'upload' },
]

/**
 * Component library panel showing available component types.
 */
export function ComponentLibrary() {
  const { t } = useTranslation()
  const editor = useEditor()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const currentTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])

  const handleClick = (item: ComponentItem) => {
    if (item.action === 'tool' && item.tool) {
      if (item.tool === 'geo') {
        editor.setStyleForNextShapes(GeoShapeGeoStyle, 'rectangle')
      }
      editor.setCurrentTool(item.tool)
    } else if (item.action === 'upload') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const asset = await editor.getAssetForExternalContent({ type: 'file', file })
          if (asset) {
            editor.createAssets([asset])
            editor.createShape({
              type: 'image',
              props: { assetId: asset.id, w: 200, h: 200 },
            })
          }
        }
      }
      input.click()
    }
  }

  const isActive = (item: ComponentItem) => {
    if (item.action !== 'tool') return false
    return currentTool === item.tool
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {COMPONENTS.map((item) => {
          const active = isActive(item)
          const hovered = hoveredId === item.id
          return (
            <button
              key={item.id}
              style={{
                ...styles.item,
                borderColor: active ? '#007acc' : hovered ? '#ccc' : '#e0e0e0',
                backgroundColor: active ? '#e8f4fc' : hovered ? '#f5f5f5' : '#fff',
              }}
              onClick={() => handleClick(item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={t(item.labelKey)}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span style={styles.label}>{t(item.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 8px',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s',
    outline: 'none',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#333',
  },
  label: {
    fontSize: 11,
    color: '#666',
  },
}
