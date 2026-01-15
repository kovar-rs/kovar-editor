import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor, getSnapshot } from 'tldraw'
import { transformToSchema, schemaToHtml } from '../../lib/transformer'
import { useConfirm } from '../../hooks/useConfirm'
import { CodePreviewModal } from '../CodePreview'
import { saveHtml, saveSchema, saveTldr } from '../../lib/api'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
]

/**
 * Top action bar with preview, save, and clear buttons.
 */
export function TopBar() {
  const { t, i18n } = useTranslation()
  const editor = useEditor()
  const confirm = useConfirm()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const saveTimeoutRef = useRef<number | null>(null)
  const langTimeoutRef = useRef<number | null>(null)

  const getExportData = () => {
    // Build assets map from editor
    const assets = new Map<string, string>()
    const allAssets = editor.getAssets()
    for (const asset of allAssets) {
      if (asset.props && 'src' in asset.props && asset.props.src) {
        assets.set(asset.id, asset.props.src as string)
      }
    }

    const shapes = editor.getCurrentPageShapes()
    const schema = transformToSchema([...shapes], { assets })
    const html = schemaToHtml(schema)
    return { schema, html }
  }

  const handleClear = async () => {
    const shapes = editor.getCurrentPageShapes()
    const shapesToDelete = shapes.filter((s) => {
      // Don't delete Main Window frame
      if (s.type === 'frame' && s.meta.is_main_window === true) {
        return false
      }
      return true
    })

    if (shapesToDelete.length === 0) {
      return
    }

    const confirmed = await confirm({
      title: t('dialog.clearAll'),
      message: t('dialog.clearConfirm', { count: shapesToDelete.length }),
      confirmText: t('clear'),
      cancelText: t('cancel'),
    })

    if (confirmed) {
      editor.deleteShapes(shapesToDelete.map((s) => s.id))
    }
  }

  const handleSave = async () => {
    if (saving) return

    setSaving(true)
    setSaveOpen(false)
    try {
      const data = getExportData()

      // Save both HTML and .tldr snapshot
      const [htmlResult] = await Promise.all([
        saveHtml(data.html),
        saveTldr(getSnapshot(editor.store)),
      ])

      if (htmlResult.success) {
        console.log('Saved successfully:', htmlResult.path)
      }
    } catch (e) {
      console.error('Save error:', e)
      alert(t('error.saveFailed', { message: (e as Error).message }))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSchema = async () => {
    if (saving) return

    setSaving(true)
    setSaveOpen(false)
    try {
      const data = getExportData()

      // Save both Schema and .tldr snapshot
      const [schemaResult] = await Promise.all([
        saveSchema(data.schema),
        saveTldr(getSnapshot(editor.store)),
      ])

      if (schemaResult.success) {
        console.log('Schema saved:', schemaResult.path)
      }
    } catch (e) {
      console.error('Save schema error:', e)
      alert(t('error.saveSchemaFailed', { message: (e as Error).message }))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMouseEnter = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    setSaveOpen(true)
  }

  const handleSaveMouseLeave = () => {
    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveOpen(false)
    }, 150)
  }

  const handleLangMouseEnter = () => {
    if (langTimeoutRef.current) {
      clearTimeout(langTimeoutRef.current)
      langTimeoutRef.current = null
    }
    setLangOpen(true)
  }

  const handleLangMouseLeave = () => {
    langTimeoutRef.current = window.setTimeout(() => {
      setLangOpen(false)
    }, 150)
  }

  const handleLangChange = (code: string) => {
    i18n.changeLanguage(code)
    setLangOpen(false)
  }

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  return (
    <>
      <div style={styles.topBar}>
        <div style={styles.left}>
          <span style={styles.logo}>Kovar Editor</span>
        </div>

        <div style={styles.actions}>
          {/* Preview */}
          <button style={styles.button} onClick={() => setPreviewOpen(true)} title={t('topbar.preview')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>{t('topbar.preview')}</span>
          </button>

          {/* Save to CLI - Split Button */}
          <div style={styles.splitButton}>
            <button
              style={{
                ...styles.button,
                borderRadius: '4px 0 0 4px',
                paddingRight: 6,
              }}
              onClick={handleSave}
              disabled={saving}
              title={t('topbar.saveHtml')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{saving ? t('topbar.saving') : t('topbar.saveHtml')}</span>
            </button>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={handleSaveMouseEnter}
              onMouseLeave={handleSaveMouseLeave}
            >
              <button
                style={styles.splitArrow}
                disabled={saving}
                title={t('topbar.moreOptions')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {saveOpen && !saving && (
                <div style={styles.dropdown}>
                  <div style={styles.menuItem} onClick={handleSaveSchema}>
                    {t('topbar.saveSchema')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clear */}
          <button style={styles.button} onClick={handleClear} title={t('topbar.clear')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{t('topbar.clear')}</span>
          </button>

          {/* Language Switcher */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={handleLangMouseEnter}
            onMouseLeave={handleLangMouseLeave}
          >
            <button style={styles.button}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{currentLang.label}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {langOpen && (
              <div style={styles.dropdown}>
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.code}
                    style={{
                      ...styles.menuItem,
                      backgroundColor: i18n.language === lang.code ? '#f0f0f0' : 'transparent',
                    }}
                    onClick={() => handleLangChange(lang.code)}
                  >
                    {lang.label}
                  </div>
                ))}
              </div>
            )}
          </div>
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
  splitButton: {
    display: 'flex',
    alignItems: 'stretch',
  },
  splitArrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 4px',
    border: 'none',
    borderRadius: '0 4px 4px 0',
    backgroundColor: 'transparent',
    color: '#555',
    cursor: 'pointer',
  },
}
