import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ConfirmContext } from '../hooks/useConfirm'
import type { ConfirmOptions } from '../hooks/useConfirm'

interface ConfirmDialogProviderProps {
  children: ReactNode
}

/**
 * Provider for global confirm dialog functionality.
 */
export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' })
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)
    return new Promise((resolve) => {
      setResolveRef(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    resolveRef?.(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolveRef?.(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && createPortal(
        <div style={styles.overlay} onClick={handleCancel}>
          <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
            {options.title && <div style={styles.title}>{options.title}</div>}
            <div style={styles.message}>{options.message}</div>
            <div style={styles.buttons}>
              <button style={styles.cancelBtn} onClick={handleCancel}>
                {options.cancelText || '取消'}
              </button>
              <button style={styles.confirmBtn} onClick={handleConfirm}>
                {options.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100001,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: 400,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.5,
    marginBottom: 20,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: 13,
    border: '1px solid #ddd',
    borderRadius: 6,
    backgroundColor: 'white',
    color: '#666',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '8px 16px',
    fontSize: 13,
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#ef4444',
    color: 'white',
    cursor: 'pointer',
  },
}
