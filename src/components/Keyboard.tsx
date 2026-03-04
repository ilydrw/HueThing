import { useState, useCallback } from 'react'

interface KeyboardProps {
  onInput: (value: string) => void
  onDone: () => void
  onCancel: () => void
  initialValue?: string
  placeholder?: string
}

export default function Keyboard({ onInput, onDone, onCancel, initialValue = '', placeholder = '192.168.1.x' }: KeyboardProps) {
  const [value, setValue] = useState(initialValue)

  const handleKey = useCallback((key: string) => {
    let newValue = value
    if (key === 'BACK') {
      newValue = value.slice(0, -1)
    } else if (key === 'CLEAR') {
      newValue = ''
    } else if (key === 'IP_PREFIX') {
      newValue = '192.168.'
    } else {
      // Prevent overly long IP strings 
      if (value.length >= 15 && key !== 'BACK') return
      newValue = value + key
    }
    setValue(newValue)
    onInput(newValue)
  }, [value, onInput])

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '192.168.', '0', '.', 'BACK']

  return (
    <div className="kb-fullscreen fade-in" style={{ touchAction: 'none' }}>
      <div className="kb-input-header" style={{ position: 'relative' }}>
        <button 
          className="action-btn secondary" 
          onClick={onCancel}
          style={{ position: 'absolute', left: 0, padding: '12px 24px', fontSize: '20px' }}
        >
          ← Back
        </button>
        <div className="kb-input-display">
          <span className="kb-prefix">IP:</span>
          <span className={`kb-main-value ${!value ? 'placeholder' : ''}`}>
            {value || placeholder}
          </span>
          {value && <button className="kb-clear-btn" onClick={() => handleKey('CLEAR')}>×</button>}
        </div>
      </div>
      
      <div className="kb-grid">
        {keys.map((key) => {
          const isPrefix = key === '192.168.'
          const isBack = key === 'BACK'
          
          return (
            <button
              key={key}
              className={`kb-key ${isPrefix ? 'kb-prefix-key' : ''} ${isBack ? 'kb-key-back' : ''}`}
              // Using onPointerDown for immediate feedback in Chrome 69
              onPointerDown={(e) => {
                e.preventDefault()
                handleKey(key === '192.168.' ? 'IP_PREFIX' : key)
              }}
              style={{ touchAction: 'manipulation' }}
            >
              {isBack ? '⌫' : key}
            </button>
          )
        })}
        
        <button 
          className="kb-key kb-done-key"
          onPointerDown={(e) => {
            e.preventDefault()
            onDone()
          }}
          disabled={!value}
          style={{ touchAction: 'manipulation' }}
        >
          Connect Bridge
        </button>
      </div>
    </div>
  )
}
