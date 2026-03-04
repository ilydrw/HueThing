import { useState, useRef, useEffect } from 'react'
import { SimplifiedLight } from '../types'
import { DeskThingClass } from '@deskthing/client'
import { HueIcon } from './HueIcons'

const deskthing = DeskThingClass.getInstance()

interface ColorPickerProps {
  light: SimplifiedLight
  onClose: () => void
}

type ColorMode = 'wheel' | 'temperature'

// Pure UI Component for the Color Picker
export default function ColorPicker({ light, onClose }: ColorPickerProps) {
  const [mode, setMode] = useState<ColorMode>('wheel')
  
  // Local state for the wheel cursor (0-360 degrees) and temperature (153-500 mireds)
  const [hueAngle, setHueAngle] = useState(0) // 0 to 360
  const [temperature, setTemperature] = useState(300) // 153 to 500
  
  // Refs for hardware bindings
  const hueRef = useRef(hueAngle)
  const tempRef = useRef(temperature)
  const modeRef = useRef(mode)
  
  useEffect(() => {
    hueRef.current = hueAngle
    tempRef.current = temperature
    modeRef.current = mode
  }, [hueAngle, temperature, mode])
  
  useEffect(() => {
    // Override Car Thing Hardware Buttons only while the Color Picker is mounted
    const removeScrollUp = deskthing.on('scrollUp' as any, () => {
      if (modeRef.current === 'wheel') {
        setHueAngle((prev) => (prev + 10) % 360)
      } else {
        setTemperature((prev) => Math.min(500, prev + 15)) // Cooler
      }
    })
    
    const removeScrollDown = deskthing.on('scrollDown' as any, () => {
      if (modeRef.current === 'wheel') {
        setHueAngle((prev) => (prev - 10 + 360) % 360)
      } else {
        setTemperature((prev) => Math.max(153, prev - 15)) // Warmer
      }
    })
    
    // Press dial to cancel
    const removeKnobPress = deskthing.on('pressShort' as any, () => {
      onClose()
    })
    
    // Support Mouse Scroll for testing in browser
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) {
        if (modeRef.current === 'wheel') setHueAngle((prev) => (prev + 5) % 360)
        else setTemperature((prev) => Math.min(500, prev + 10))
      } else {
        if (modeRef.current === 'wheel') setHueAngle((prev) => (prev - 5 + 360) % 360)
        else setTemperature((prev) => Math.max(153, prev - 10))
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      removeScrollUp()
      removeScrollDown()
      removeKnobPress()
      window.removeEventListener('wheel', handleWheel)
    }
  }, [onClose])
  
  const handleConfirm = () => {
    if (mode === 'wheel') {
      // Send HSV equivalent to the server (Saturation ~100%, Brightness handled separately)
      // The server will handle the conversion to CIE xy
      deskthing.send({
        type: 'setLightColor',
        payload: { lightId: light.id, hue: hueAngle, saturation: 100 }
      })
    } else {
      // Send pure Mireds
      deskthing.send({
        type: 'setLightColor',
        payload: { lightId: light.id, temperature }
      })
    }
    onClose()
  }

  // Calculate cursor positions
  // For Wheel: Angle to X/Y
  const wheelRadius = 120
  const radian = (hueAngle - 90) * (Math.PI / 180) // -90 to start at top
  const cursorX = wheelRadius + (wheelRadius * 0.8) * Math.cos(radian)
  const cursorY = wheelRadius + (wheelRadius * 0.8) * Math.sin(radian)
  
  // For Temp: Percentage along the bar
  const tempPercent = ((temperature - 153) / (500 - 153)) * 100

  return (
    <div className="color-picker-fullscreen fade-in">
      <div className="title-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button className="tile-icon-bg" style={{ border: 'none', background: 'rgba(255,255,255,0.08)', width: '48px', height: '48px', margin: 0 }} onClick={onClose}>✕</button>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 500, margin: 0 }}>{light.name}</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Adjust Color</p>
        </div>
      </div>

      <div className="picker-container">
        {mode === 'wheel' ? (
          <div className="color-wheel">
            <div 
              className="color-cursor" 
              style={{ left: cursorX, top: cursorY, backgroundColor: `hsl(${hueAngle}, 100%, 50%)` }} 
            />
          </div>
        ) : (
          <div className="temp-slider">
            <div 
              className="temp-cursor"
              style={{ left: `${tempPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="picker-controls">
        <div className="mode-toggles">
          <button 
            className={`mode-btn ${mode === 'wheel' ? 'active' : ''}`}
            onClick={() => setMode('wheel')}
          >
            Color
          </button>
          <button 
            className={`mode-btn ${mode === 'temperature' ? 'active' : ''}`}
            onClick={() => setMode('temperature')}
          >
            White
          </button>
        </div>
        
        <button className="action-btn confirm-btn" onClick={handleConfirm}>
          Confirm Color
        </button>
      </div>
    </div>
  )
}
