import { useEditor, GeoShapeGeoStyle } from 'tldraw'

interface ComponentItem {
  id: string
  label: string
  icon: string
  action: 'tool' | 'upload'
  tool?: string
}

const COMPONENTS: ComponentItem[] = [
  { id: 'select', label: '选择', icon: '↖', action: 'tool', tool: 'select' },
  { id: 'geo', label: '矩形', icon: '□', action: 'tool', tool: 'geo' },
  { id: 'frame', label: '框架', icon: '▢', action: 'tool', tool: 'frame' },
  { id: 'text', label: '文本', icon: 'T', action: 'tool', tool: 'text' },
  { id: 'image', label: '图片', icon: '▣', action: 'upload' },
]

/**
 * Component library panel showing available component types.
 */
export function ComponentLibrary() {
  const editor = useEditor()

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

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {COMPONENTS.map((item) => (
          <button
            key={item.id}
            style={styles.item}
            onClick={() => handleClick(item)}
            title={item.label}
          >
            <span style={styles.icon}>{item.icon}</span>
            <span style={styles.label}>{item.label}</span>
          </button>
        ))}
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
