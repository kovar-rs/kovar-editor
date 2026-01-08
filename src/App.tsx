import { Tldraw, DefaultDashStyle } from 'tldraw'
import type { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import './lib/constants'
import { Layout, TopBarPortal, LeftPanelPortal, RightPanelPortal } from './components/layout/Layout'
import { TopBar } from './components/layout/TopBar'
import { LeftPanel } from './components/layout/LeftPanel'
import { RightPanel } from './components/layout/RightPanel'
import { CanvasLimiter } from './components/CanvasLimiter'
import { Toolbar } from './components/Toolbar'
import { ContextMenu } from './components/ContextMenu'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { CursorFix } from './components/CursorFix'
import { ShapeNaming } from './components/ShapeNaming'
import { BorderWidthSync } from './components/BorderWidthSync'
import { ConfirmDialogProvider } from './components/ConfirmDialog'

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
      <Toolbar />
      <ContextMenu />
    </>
  )
}

/**
 * Sets default styles for new shapes.
 */
function handleMount(editor: Editor) {
  editor.setStyleForNextShapes(DefaultDashStyle, 'solid')
}

export default function App() {
  return (
    <ConfirmDialogProvider>
      <Layout>
        <Tldraw hideUi onMount={handleMount}>
          <EditorUI />
        </Tldraw>
      </Layout>
    </ConfirmDialogProvider>
  )
}
