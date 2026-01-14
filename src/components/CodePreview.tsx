import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useEditor, getSnapshot, useValue } from 'tldraw'
import { transformToSchema, schemaToHtml } from '../lib/transformer'

interface CodePreviewProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'json' | 'schema' | 'html'

/**
 * IDE-style code preview modal with three panels.
 */
export function CodePreviewModal({ isOpen, onClose }: CodePreviewProps) {
  const { t } = useTranslation()
  const editor = useEditor()
  const [activeTab, setActiveTab] = useState<TabType>('schema')

  // Subscribe to shape changes to trigger re-computation
  const shapes = useValue('shapes', () => editor.getCurrentPageShapes(), [editor])

  // Compute code using useMemo instead of useEffect + setState
  const code = useMemo(() => {
    if (!isOpen) {
      return { json: '', schema: '', html: '' }
    }

    try {
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

      const schema = transformToSchema([...shapes], { assets })
      const schemaString = JSON.stringify(schema, null, 2)
      const html = schemaToHtml(schema)

      return { json: jsonString, schema: schemaString, html }
    } catch (e) {
      console.error('Code preview error:', e)
      return {
        json: '// Error loading JSON',
        schema: '// Error: ' + (e as Error).message,
        html: '<!-- Error -->',
      }
    }
  }, [isOpen, editor, shapes])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const tabs: { id: TabType; label: string; lang: string }[] = [
    { id: 'json', label: '.tldr', lang: 'json' },
    { id: 'schema', label: 'Schema', lang: 'json' },
    { id: 'html', label: 'HTML', lang: 'html' },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!isOpen) return null

  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {}),
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={styles.actions}>
            <button
              style={styles.actionButton}
              onClick={() => copyToClipboard(code[activeTab])}
              title={t('preview.copyCode')}
            >
              {t('copy')}
            </button>
            <button style={styles.closeButton} onClick={onClose}>
              X
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div style={styles.content}>
          <pre style={styles.pre}>
            <code style={styles.code}>{code[activeTab]}</code>
          </pre>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.lineCount}>
            {code[activeTab].split('\n').length} {t('preview.lines')}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * Button to open code preview modal.
 */
export function CodePreviewButton() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        style={styles.previewButton}
        onClick={() => setIsOpen(true)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span style={styles.buttonIcon}>&lt;/&gt;</span>
        {t('preview.code')}
      </button>
      <CodePreviewModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  // Preview Button
  previewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 12,
    pointerEvents: 'all',
  },
  buttonIcon: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#4ade80',
  },

  // Modal Overlay
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    backdropFilter: 'blur(4px)',
  },

  // Modal Container
  modal: {
    width: '90vw',
    maxWidth: 1200,
    height: '80vh',
    backgroundColor: '#0d1117',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid #30363d',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
    height: 48,
  },

  // Tabs
  tabs: {
    display: 'flex',
    gap: 0,
  },
  tab: {
    padding: '12px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#8b949e',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s',
  },
  tabActive: {
    color: '#f0f6fc',
    borderBottomColor: '#2f80ed',
    backgroundColor: 'rgba(47, 128, 237, 0.1)',
  },

  // Actions
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  closeButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    color: '#8b949e',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    cursor: 'pointer',
  },

  // Content
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 0,
  },
  pre: {
    margin: 0,
    padding: 20,
    minHeight: '100%',
    backgroundColor: '#0d1117',
  },
  code: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.6,
    color: '#c9d1d9',
    whiteSpace: 'pre',
  },

  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#161b22',
    borderTop: '1px solid #30363d',
    fontSize: 12,
    color: '#8b949e',
  },
  footerText: {
    color: '#8b949e',
  },
  lineCount: {
    color: '#6e7681',
  },
}
