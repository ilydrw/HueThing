import { SimplifiedRoom, SimplifiedScene } from '../types'
import { DeskThingClass } from '@deskthing/client'

const deskthing = DeskThingClass.getInstance()

interface ScenePickerProps {
  room: SimplifiedRoom
  scenes: SimplifiedScene[]
  rooms: SimplifiedRoom[]
  onBack: () => void
  onRoomChange: (room: SimplifiedRoom) => void
}

export default function ScenePicker({ room, scenes, rooms, onBack, onRoomChange }: ScenePickerProps) {
  
  const handleActivateScene = (sceneId: string) => {
    deskthing.send({
      type: 'activateScene',
      payload: { sceneId }
    })
  }

  // Predefined gradients for typical Hue scene vibes if scene has no colors
  const defaultGradients = [
    'linear-gradient(135deg, #FF6B6B, #FFD93D)',
    'linear-gradient(135deg, #6BCB77, #4D96FF)',
    'linear-gradient(135deg, #9772FB, #F07DEA)',
    'linear-gradient(135deg, #FF9F45, #FF6B6B)'
  ]

  return (
    <div className="view-container fade-in">
      <div className="title-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <button className="tile-icon-bg" style={{ border: 'none', background: 'rgba(255,255,255,0.08)', width: '48px', height: '48px', margin: 0 }} onClick={onBack}>←</button>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 500, margin: 0, letterSpacing: '-0.5px' }}>Scenes</h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 500 }}>{room.name}</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto', display: 'flex', gap: '10px', marginBottom: '24px', paddingBottom: '8px' }}>
        {rooms.map(r => (
          <button
            key={r.id}
            onClick={() => onRoomChange(r)}
            style={{
              padding: '8px 24px',
              borderRadius: '20px',
              border: 'none',
              background: r.id === room.id ? 'var(--accent-hue)' : 'var(--bg-surface)',
              color: r.id === room.id ? '#000' : '#fff',
              fontWeight: '700',
              whiteSpace: 'nowrap'
            }}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="tile-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {scenes.map((scene, idx) => {
          const colors = scene.colors
          const gradient = colors.length >= 2 
            ? `linear-gradient(135deg, rgb(${Math.round(colors[0].x*255)}, ${Math.round(colors[0].y*255)}, 150), rgb(${Math.round(colors[1].x*255)}, ${Math.round(colors[1].y*255)}, 150))`
            : defaultGradients[idx % defaultGradients.length]

          return (
            <div 
              key={scene.id} 
              className="scene-card"
              style={{ background: gradient }}
              onClick={() => handleActivateScene(scene.id)}
            >
              <span className="scene-card-title">{scene.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
