import { TabContainer } from '../panels/TabContainer'
import { ComponentLibrary } from '../panels/ComponentLibrary'
import { LayerTree } from '../panels/LayerTree'

/**
 * Left panel with component library and layer tree tabs.
 */
export function LeftPanel() {
  const tabs = [
    { id: 'components', label: '组件库', content: <ComponentLibrary /> },
    { id: 'layers', label: '层级', content: <LayerTree /> },
  ]

  return <TabContainer tabs={tabs} defaultTab="components" />
}
