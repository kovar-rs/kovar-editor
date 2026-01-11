import { useState, useRef } from 'react'
import { useEditor, getSnapshot, loadSnapshot } from 'tldraw'
import { transformToSchema, schemaToHtml } from '../../lib/transformer'
import { useConfirm } from '../../hooks/useConfirm'
import { CodePreviewModal } from '../CodePreview'
import { MAIN_FRAME_ID } from '../../lib/constants'
import { saveHtml } from '../../lib/api'

type ExportType = 'all' | 'json' | 'schema' | 'html'

/**
 * Top action bar with import, export, preview, save, and clear buttons.
 */
export function TopBar() {
  const editor = useEditor()
  const confirm = useConfirm()
  const [exportOpen, setExportOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportTimeoutRef = useRef<number | null>(null)

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

  const handleSave = async () => {
    if (saving) return

    setSaving(true)
    try {
      const data = getExportData()
      const result = await saveHtml(data.html)
      if (result.success) {
        console.log('Saved successfully:', result.path)
      }
    } catch (e) {
      console.error('Save error:', e)
      alert('保存失败: ' + (e as Error).message)
    } finally {
      setSaving(false)
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

      <div style={styles.topBar}>
        <div style={styles.left}>
          <span style={styles.logo}>Kovar Editor</span>
        </div>

        <div style={styles.actions}>
          {/* Import */}
          <button style={styles.button} onClick={handleImport} title="导入">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>导入</span>
          </button>

          {/* Export */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={handleExportMouseEnter}
            onMouseLeave={handleExportMouseLeave}
          >
            <button style={styles.button} title="导出">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>导出</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {exportOpen && (
              <div style={styles.dropdown}>
                <div style={styles.menuItem} onClick={() => handleExport('all')}>
                  全部导出
                </div>
                <div style={styles.divider} />
                <div style={styles.menuItem} onClick={() => handleExport('json')}>
                  .tldr
                </div>
                <div style={styles.menuItem} onClick={() => handleExport('schema')}>
                  Schema
                </div>
                <div style={styles.menuItem} onClick={() => handleExport('html')}>
                  HTML
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <button style={styles.button} onClick={() => setPreviewOpen(true)} title="预览代码">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>预览</span>
          </button>

          {/* Save to CLI */}
          <button
            style={{
              ...styles.button,
              ...(saving ? styles.buttonDisabled : styles.buttonPrimary),
            }}
            onClick={handleSave}
            disabled={saving}
            title="保存到 kovar-cli"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>

          {/* Clear */}
          <button style={styles.button} onClick={handleClear} title="清除所有组件">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>清除</span>
          </button>
        </div>
      </div>

      <CodePreviewModal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} />
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    height: 40,
    backgroundColor: '#f8f8f8',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    border: 'none',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: '#555',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  buttonPrimary: {
    backgroundColor: '#007acc',
    color: 'white',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    color: '#888',
    cursor: 'not-allowed',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: 'white',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '4px 0',
    minWidth: 120,
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
