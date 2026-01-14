import { Tldraw, DefaultDashStyle } from 'tldraw'
import type { Editor, TLComponents } from 'tldraw'
import { useTranslation } from 'react-i18next'
import 'tldraw/tldraw.css'
import './lib/constants'
import { Layout, TopBarPortal, LeftPanelPortal, RightPanelPortal } from './components/layout/Layout'
import { TopBar } from './components/layout/TopBar'
import { LeftPanel } from './components/layout/LeftPanel'
import { RightPanel } from './components/layout/RightPanel'
import { CanvasLimiter } from './components/CanvasLimiter'
import { ContextMenu } from './components/ContextMenu'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { CursorFix } from './components/CursorFix'
import { ShapeNaming } from './components/ShapeNaming'
import { BorderWidthSync } from './components/BorderWidthSync'
import { ConfirmDialogProvider } from './components/ConfirmDialog'

/**
 * Disable tldraw's default context menu - we use our own.
 */
const components: TLComponents = {
  ContextMenu: null,
}

/**
 * Inner components that require editor context and use portals.
 */
function EditorUI() {
  return (
    <>
      {/* Portal content to layout slots */}
      <TopBarPortal>
        <TopBar />
      </TopBarPortal>
      <LeftPanelPortal>
        <LeftPanel />
      </LeftPanelPortal>
      <RightPanelPortal>
        <RightPanel />
      </RightPanelPortal>

      {/* Canvas components */}
      <CanvasLimiter />
      <ShapeNaming />
      <KeyboardShortcuts />
      <CursorFix />
      <BorderWidthSync />
      <ContextMenu />
    </>
  )
}

/**
 * Sets default styles for new shapes.
 */
function handleMount(editor: Editor, locale: string) {
  editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
  // Sync tldraw locale with i18n
  editor.user.updateUserPreferences({ locale })
}

export default function App() {
  const { i18n } = useTranslation()

  const onMount = (editor: Editor) => {
    handleMount(editor, i18n.language)

    // Listen for language changes and update tldraw
    const handleLanguageChange = (lng: string) => {
      editor.user.updateUserPreferences({ locale: lng })
    }
    i18n.on('languageChanged', handleLanguageChange)
  }

  return (
    <ConfirmDialogProvider>
      <Layout>
        <Tldraw hideUi components={components} onMount={onMount}>
          <EditorUI />
        </Tldraw>
      </Layout>
    </ConfirmDialogProvider>
  )
}
