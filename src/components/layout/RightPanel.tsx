import { TabContainer } from '../panels/TabContainer'
import { PropertiesTab } from '../panels/PropertiesTab'
import { StylesTab } from '../panels/StylesTab'

/**
 * Right panel with properties and styles tabs.
 */
export function RightPanel() {
  const tabs = [
    { id: 'properties', label: '属性', content: <PropertiesTab /> },
    { id: 'styles', label: '样式', content: <StylesTab /> },
  ]

  return <TabContainer tabs={tabs} defaultTab="properties" />
}
