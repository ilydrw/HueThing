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
    if (key === 'BACKSPACE') {
      setValue(prev => {
        const newValue = prev.slice(0, -1)
        onInput(newValue)
        return newValue
      })
    } else if (key === 'CLEAR') {
      setValue('')
      onInput('')
    } else if (key === 'CANCEL') {
      onCancel()
    } else {
      // Basic validation for IP characters
      if (value.length < 15) {
        setValue(prev => {
          const newValue = prev + key
          onInput(newValue)
          return newValue
        })
      }
    }
  }, [value, onCancel, onInput])

  // Custom key layout 
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'BACKSPACE', '192.168.']

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
        {keys.map(key => (
          <button 
            key={key}
            className={`kb-key ${key === '192.168.' ? 'kb-prefix-key' : ''} ${key === 'BACKSPACE' ? 'kb-key-back' : ''}`}
            onClick={() => handleKey(key)}
          >
            {key === 'BACKSPACE' ? '⌫' : key}
          </button>
        ))}
        
        <button 
          className="kb-key kb-done-key"
          onClick={onDone}
          disabled={!value || value.length < 7}
        >
          Connect Bridge
        </button>
      </div>
    </div>
  )
}
