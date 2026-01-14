import { useTranslation } from 'react-i18next'
import { TabContainer } from '../panels/TabContainer'
import { ComponentLibrary } from '../panels/ComponentLibrary'
import { LayerTree } from '../panels/LayerTree'

/**
 * Left panel with component library and layer tree tabs.
 */
export function LeftPanel() {
  const { t } = useTranslation()
  const tabs = [
    { id: 'components', label: t('panel.components'), content: <ComponentLibrary /> },
    { id: 'layers', label: t('panel.layers'), content: <LayerTree /> },
  ]

  return <TabContainer tabs={tabs} defaultTab="components" />
}
