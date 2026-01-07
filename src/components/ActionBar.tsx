import { useState, useRef } from 'react'
import { useEditor, getSnapshot, loadSnapshot } from 'tldraw'
import { transformToSchema, schemaToHtml } from '../lib/transformer'
import { useDraggable } from '../hooks/useDraggable'
import { useConfirm } from '../hooks/useConfirm'
import { CodePreviewModal } from './CodePreview'
import { MAIN_FRAME_ID } from '../lib/constants'

type ExportType = 'all' | 'json' | 'schema' | 'html'

/**
 * Action bar with import, export, preview, and clear buttons (icon-only).
 */
export function ActionBar() {
  const editor = useEditor()
  const confirm = useConfirm()
  const [exportOpen, setExportOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportTimeoutRef = useRef<number | null>(null)

  const { position, handleMouseDown } = useDraggable({
    initialPosition: { x: 12, y: 12 },
    storageKey: 'kovar:action-bar-pos',
  })

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getExportData = () => {
    const snapshot = getSnapshot(editor.store)
    const jsonString = JSON.stringify(snapshot, null, 2)

    // Build assets map from snapshot
    const assets = new Map<string, string>()
    const store = snapshot.document?.store || {}
    for (const [id, record] of Object.entries(store)) {
      if (id.startsWith('asset:')) {
        const asset = record as { props?: { src?: string } }
        if (asset.props?.src) {
          assets.set(id, asset.props.src)
        }
      }
    }

    const shapes = editor.getCurrentPageShapes()
    const schema = transformToSchema([...shapes], { assets })
    const schemaString = JSON.stringify(schema, null, 2)
    const html = schemaToHtml(schema)
    return { json: jsonString, schema: schemaString, html }
  }

  const handleExport = (type: ExportType) => {
    try {
      const data = getExportData()
      switch (type) {
        case 'all':
          downloadFile(data.json, 'kovar-ui.tldr', 'application/json')
          downloadFile(data.schema, 'kovar-schema.json', 'application/json')
          downloadFile(data.html, 'kovar-ui.html', 'text/html')
          break
        case 'json':
          downloadFile(data.json, 'kovar-ui.tldr', 'application/json')
          break
        case 'schema':
          downloadFile(data.schema, 'kovar-schema.json', 'application/json')
          break
        case 'html':
          downloadFile(data.html, 'kovar-ui.html', 'text/html')
          break
      }
    } catch (e) {
      console.error('Export error:', e)
      alert('导出失败: ' + (e as Error).message)
    }
    setExportOpen(false)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const snapshot = JSON.parse(content)
        loadSnapshot(editor.store, snapshot)
      } catch (err) {
        console.error('Import error:', err)
        alert('导入失败: 无效的 .tldr 文件')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportMouseEnter = () => {
    if (exportTimeoutRef.current) {
      clearTimeout(exportTimeoutRef.current)
      exportTimeoutRef.current = null
    }
    setExportOpen(true)
  }

  const handleExportMouseLeave = () => {
    exportTimeoutRef.current = window.setTimeout(() => {
      setExportOpen(false)
    }, 150)
  }

  const handleClear = async () => {
    const shapes = editor.getCurrentPageShapes()
    const shapesToDelete = shapes.filter((s) => s.id !== `shape:${MAIN_FRAME_ID}`)

    if (shapesToDelete.length === 0) {
      return
    }

    const confirmed = await confirm({
      title: '清除所有组件',
      message: `确定要清除所有组件吗？（共 ${shapesToDelete.length} 个）`,
      confirmText: '清除',
      cancelText: '取消',
    })

    if (confirmed) {
      editor.deleteShapes(shapesToDelete.map((s) => s.id))
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".tldr"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

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
          border: '1px solid rgba(0,0,0,0.08)',
          pointerEvents: 'all',
          cursor: 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Import */}
        <button
          style={styles.iconButton}
          onClick={handleImport}
          onPointerDown={(e) => e.stopPropagation()}
          title="导入 JSON"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>

        {/* Export */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={handleExportMouseEnter}
          onMouseLeave={handleExportMouseLeave}
        >
          <button
            style={styles.iconButton}
            onPointerDown={(e) => e.stopPropagation()}
            title="导出"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          {exportOpen && (
            <div style={styles.dropdown}>
              <div
                style={styles.menuItem}
                onClick={() => handleExport('all')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                全部导出
              </div>
              <div style={styles.divider} />
              <div
                style={styles.menuItem}
                onClick={() => handleExport('json')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                .tldr
              </div>
              <div
                style={styles.menuItem}
                onClick={() => handleExport('schema')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Schema
              </div>
              <div
                style={styles.menuItem}
                onClick={() => handleExport('html')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                HTML
              </div>
            </div>
          )}
        </div>

        {/* Code Preview */}
        <button
          style={styles.iconButton}
          onClick={() => setPreviewOpen(true)}
          onPointerDown={(e) => e.stopPropagation()}
          title="预览代码"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </button>

        {/* Clear */}
        <button
          style={styles.iconButton}
          onClick={handleClear}
          onPointerDown={(e) => e.stopPropagation()}
          title="清除所有组件"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <CodePreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  iconButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#555',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    padding: '4px 0',
    minWidth: 110,
    zIndex: 100000,
  },
  menuItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 12,
    color: '#333',
    transition: 'background-color 0.1s',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    margin: '4px 0',
  },
}
