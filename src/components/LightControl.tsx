import React from 'react'
import { SimplifiedRoom, SimplifiedLight } from '../types'
import { DeskThingClass } from '@deskthing/client'
import { HueIcon } from './HueIcons'
import LightCard from './LightCard'

const deskthing = DeskThingClass.getInstance()

interface LightControlProps {
  room: SimplifiedRoom
  lights: SimplifiedLight[]
  onBack: () => void
  onPickColor: (light: SimplifiedLight) => void
}

export default function LightControl({ room, lights, onBack, onPickColor }: LightControlProps) {
  
  const handleToggleRoom = () => {
    deskthing.send({
      type: 'setRoom',
      payload: { groupedLightId: room.groupedLightId, on: !room.on }
    })
  }

  const handleLightToggle = (id: string) => {
    const light = lights.find(l => l.id === id);
    if (!light) return;
    
    deskthing.send({
      type: 'setLight',
      payload: { lightId: id, on: !light.on }
    })
  }

  const handleBrightnessChange = (id: string, brightness: number) => {
    deskthing.send({
      type: 'setLight',
      payload: { lightId: id, brightness: Math.round(brightness), on: true }
    })
  }

  return (
    <div className="view-container" style={{
      width: '800px',
      height: '480px',
      background: '#010417',
      padding: '32px 0 32px 32px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* Title & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'rgba(255,255,255,0.08)', 
            border: 'none', 
            color: '#fff', 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%',
            fontSize: '20px',
            marginRight: '20px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>{room.name}</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0 0', fontWeight: 600 }}>
            {lights.length} Total Devices
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '24px' }}>
        {/* Scrollable Light Grid (Bento Style) */}
        <div style={{ 
          flex: 1, 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px', 
          overflowY: 'auto',
          paddingRight: '12px',
          paddingBottom: '20px'
        }}>
          
          {/* Master Control Hero - Spans 2 columns */}
          <div 
            onClick={handleToggleRoom}
            style={{
              gridColumn: 'span 2',
              height: '90px',
              background: room.on ? 'var(--hue-blue, #0F70B8)' : 'rgba(255,255,255,0.05)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              border: room.on ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: room.on ? '#fff' : '#fff' }}>Master Control</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Turn everything {room.on ? 'off' : 'on'}</div>
            </div>
            <HueIcon type="power" size={32} color={room.on ? "#fff" : "rgba(255,255,255,0.3)"} />
          </div>

          {/* Individual Light Cards */}
          {lights.map((light) => (
            <div key={light.id} style={{ position: 'relative' }}>
              <LightCard 
                id={light.id}
                name={light.name}
                isOn={light.on}
                brightness={light.brightness}
                onToggle={() => handleLightToggle(light.id)}
                onBrightnessChange={handleBrightnessChange}
              />
              
              {/* Color Picker Shortcut - Only visible when light is on */}
              {light.on && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onPickColor(light); }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 20,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  🎨
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Right Safe Zone for Dial (80px) */}
        <div style={{ width: '80px', flexShrink: 0 }} />
      </div>
    </div>
  )
}