import { useEditor, useValue, GeoShapeGeoStyle } from 'tldraw'
import { ALLOWED_TOOLS, type AllowedTool } from '../lib/constants'
import { useDraggable } from '../hooks/useDraggable'

interface ToolButtonProps {
  label: string
  icon: string
  isActive: boolean
  onClick: () => void
}

function ToolButton({ label, icon, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      title={label}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 6,
        backgroundColor: isActive ? '#2f80ed' : 'transparent',
        color: isActive ? 'white' : '#555',
        cursor: 'pointer',
        fontSize: 16,
        transition: 'all 0.15s ease',
      }}
    >
      {icon}
    </button>
  )
}

const TOOL_CONFIG: Record<AllowedTool, { label: string; icon: string }> = {
  select: { label: '选择', icon: '↖' },
  geo: { label: '矩形', icon: '□' },
  frame: { label: '框架', icon: '▢' },
  text: { label: '文本', icon: 'T' },
  asset: { label: '图片', icon: '▣' },
}

/**
 * Minimal draggable toolbar with essential tools.
 */
export function Toolbar() {
  const editor = useEditor()
  const currentTool = useValue('current tool', () => editor.getCurrentToolId(), [editor])

  const { position, handleMouseDown } = useDraggable({
    initialPosition: { x: (window.innerWidth - 180) / 2, y: 12 },
    storageKey: 'kovar:toolbar-pos',
  })

  const handleToolClick = (tool: AllowedTool) => {
    if (tool === 'geo') {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, 'rectangle')
    }
    if (tool === 'asset') {
      // Open file picker for image upload
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
      return
    }
    editor.setCurrentTool(tool)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        display: 'flex',
        gap: 2,
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        pointerEvents: 'all',
        border: '1px solid rgba(0,0,0,0.08)',
        cursor: 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {ALLOWED_TOOLS.map((tool) => (
        <ToolButton
          key={tool}
          label={TOOL_CONFIG[tool].label}
          icon={TOOL_CONFIG[tool].icon}
          isActive={currentTool === tool}
          onClick={() => handleToolClick(tool)}
        />
      ))}
    </div>
  )
}
