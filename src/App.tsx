import { Tldraw, DefaultDashStyle } from 'tldraw'
import type { Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import './lib/constants'
import { CanvasLimiter } from './components/CanvasLimiter'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { ContextMenu } from './components/ContextMenu'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { CursorFix } from './components/CursorFix'
import { ActionBar } from './components/ActionBar'
import { ShapeNaming } from './components/ShapeNaming'
import { BorderWidthSync } from './components/BorderWidthSync'
import { ConfirmDialogProvider } from './components/ConfirmDialog'

/**
 * Inner components that require editor context.
 */
function EditorUI() {
  return (
    <>
      <CanvasLimiter />
      <ShapeNaming />
      <KeyboardShortcuts />
      <CursorFix />
      <BorderWidthSync />
      <Toolbar />
      <ActionBar />
      <PropertiesPanel />
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
      <div style={{ position: 'fixed', inset: 0 }}>
        <Tldraw hideUi onMount={handleMount}>
          <EditorUI />
        </Tldraw>
      </div>
    </ConfirmDialogProvider>
  )
}
