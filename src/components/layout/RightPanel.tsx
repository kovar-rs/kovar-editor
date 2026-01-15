import { useTranslation } from 'react-i18next'
import { TabContainer } from '../panels/TabContainer'
import { PropertiesTab } from '../panels/PropertiesTab'
import { StylesTab } from '../panels/StylesTab'

/**
 * Right panel with properties and styles tabs.
 */
export function RightPanel() {
  const { t } = useTranslation()
  const tabs = [
    { id: 'properties', label: t('panel.properties'), content: <PropertiesTab /> },
    { id: 'styles', label: t('panel.styles'), content: <StylesTab /> },
  ]

  return <TabContainer tabs={tabs} defaultTab="properties" />
}
