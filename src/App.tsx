import { Tldraw } from 'tldraw'
import type { TLComponents } from 'tldraw'
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
import { EditorSetup } from './components/EditorSetup'

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
      {/* Editor initialization */}
      <EditorSetup />

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

export default function App() {
  return (
    <ConfirmDialogProvider>
      <Layout>
        <Tldraw hideUi components={components}>
          <EditorUI />
        </Tldraw>
      </Layout>
    </ConfirmDialogProvider>
  )
}
