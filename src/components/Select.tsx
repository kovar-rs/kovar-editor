import { useState, useRef, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

/**
 * Custom styled select dropdown component.
 */
export function Select({ value, options, onChange }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} style={styles.container}>
      <button
        style={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span>{selectedOption?.label || value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {options.map((option) => (
            <div
              key={option.value}
              style={{
                ...styles.option,
                backgroundColor: option.value === value ? '#f0f0f0' : 'transparent',
              }}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = option.value === value ? '#f0f0f0' : 'transparent'
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
  },
  trigger: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 12,
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 5,
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#333',
    outline: 'none',
    boxSizing: 'border-box',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: 'white',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid rgba(0,0,0,0.08)',
    zIndex: 100,
    overflow: 'hidden',
  },
  option: {
    padding: '8px 10px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#333',
    transition: 'background-color 0.1s',
  },
}
