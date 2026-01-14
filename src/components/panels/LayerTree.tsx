import { useTranslation } from 'react-i18next'

/**
 * Layer tree panel placeholder (coming soon).
 */
export function LayerTree() {
  const { t } = useTranslation()

  return (
    <div style={styles.container}>
      <div style={styles.placeholder}>
        <span style={styles.icon}>🗂</span>
        <span style={styles.text}>{t('layers.title')}</span>
        <span style={styles.soon}>{t('layers.comingSoon')}</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    color: '#999',
  },
  icon: {
    fontSize: 32,
  },
  text: {
    fontSize: 13,
    fontWeight: 500,
  },
  soon: {
    fontSize: 11,
    backgroundColor: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: 10,
  },
}
