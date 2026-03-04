import { useState } from 'react'
import { SimplifiedRoom, SimplifiedLight } from '../types'
import { DeskThingClass } from '@deskthing/client'
import { HueIcon } from './HueIcons'

const deskthing = DeskThingClass.getInstance()

interface LightControlProps {
  room: SimplifiedRoom
  lights: SimplifiedLight[]
  onBack: () => void
}

export default function LightControl({ room, lights, onBack }: LightControlProps) {
  const [expandedLight, setExpandedLight] = useState<string | null>(null)

  const handleToggleRoom = () => {
    deskthing.send({
      type: 'setRoom',
      payload: { groupedLightId: room.groupedLightId, on: !room.on }
    })
  }

  const handleLightToggle = (light: SimplifiedLight) => {
    deskthing.send({
      type: 'setLight',
      payload: { lightId: light.id, on: !light.on }
    })
  }

  const handleBrightnessChange = (lightId: string, brightness: number) => {
    deskthing.send({
      type: 'setLight',
      payload: { lightId, brightness: Number(brightness), on: true }
    })
  }

  return (
    <div className="view-container fade-in">
      <div className="title-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <button className="tile-icon-bg" style={{ border: 'none', background: 'rgba(255,255,255,0.08)', width: '48px', height: '48px', margin: 0 }} onClick={onBack}>←</button>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 500, margin: 0, letterSpacing: '-0.5px' }}>{room.name}</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 500 }}>{lights.length} Lights</p>
        </div>
      </div>

      <div className="tile-grid">
        {lights.map((light) => (
          <div 
            key={light.id} 
            className={`hue-tile ${light.on ? 'active' : ''}`}
            onClick={() => handleLightToggle(light)}
            style={light.on ? ({ 
              '--active-glow': 'radial-gradient(circle at top right, var(--accent-hue), transparent)',
              paddingBottom: '60px' // Make space for the integrated slider
            } as any) : {}}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="tile-icon-bg" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                {light.on ? '💡' : '🌑'}
              </div>
              <div className="tile-title">{light.name}</div>
            </div>

            {light.on && (
              <div 
                className="hue-slider-container" 
                style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="hue-slider-fill" style={{ width: `${light.brightness}%` }} />
                <input 
                  type="range"
                  className="hue-slider-input"
                  min="1"
                  max="100"
                  value={light.brightness}
                  onChange={(e) => handleBrightnessChange(light.id, Number(e.target.value))}
                />
              </div>
            )}
          </div>
        ))}

        {/* Room Master Control Tile */}
        <div 
          className="hue-tile active"
          style={{ gridColumn: 'span 2', background: 'var(--accent-hue)', border: 'none', color: '#000', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: '80px', padding: '20px 24px' }}
          onClick={handleToggleRoom}
        >
          <div>
            <div className="tile-title" style={{ color: '#000', fontSize: '22px', marginBottom: '2px' }}>Master Control</div>
            <div className="tile-subtitle" style={{ color: 'rgba(0,0,0,0.6)', fontSize: '16px' }}>Turn everything {room.on ? 'off' : 'on'}</div>
          </div>
          <div style={{ fontSize: '36px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>{room.on ? '⭕' : '🔘'}</div>
        </div>
      </div>
    </div>
  )
}
