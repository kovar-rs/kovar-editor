import { useState, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabContainerProps {
  tabs: Tab[]
  defaultTab?: string
}

/**
 * Generic tab container component.
 */
export function TabContainer({ tabs, defaultTab }: TabContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeContent = tabs.find((t) => t.id === activeTab)?.content

  return (
    <div style={styles.container}>
      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={styles.content}>{activeContent}</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f8f8',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    color: '#666',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  activeTab: {
    color: '#007acc',
    borderBottomColor: '#007acc',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#fff',
  },
}
