import { useEffect } from 'react'
import { useEditor, DefaultDashStyle, DefaultFontStyle } from 'tldraw'
import { useTranslation } from 'react-i18next'

/**
 * Set default editor styles and sync locale with i18n.
 */
export function useEditorDefaults() {
  const editor = useEditor()
  const { i18n } = useTranslation()

  useEffect(() => {
    // Set default shape styles
    editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
    editor.setStyleForNextShapes(DefaultFontStyle, 'sans')

    // Sync tldraw locale with i18n
    editor.user.updateUserPreferences({ locale: i18n.language })

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      editor.user.updateUserPreferences({ locale: lng })
    }
    i18n.on('languageChanged', handleLanguageChange)

    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [editor, i18n])
}
