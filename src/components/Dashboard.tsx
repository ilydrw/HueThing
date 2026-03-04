import { SimplifiedRoom, HueState } from '../types'
import { HueIcon } from './HueIcons'

interface DashboardProps {
  hueState: HueState
  onRoomSelect: (room: SimplifiedRoom) => void
  onViewScenes: (room: SimplifiedRoom) => void
}

export default function Dashboard({ hueState, onRoomSelect }: DashboardProps) {
  return (
    <div className="view-container fade-in">
      <div className="title-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 300, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>Good evening</h2>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 500 }}>Control your Hue lights and scenes</p>
      </div>

      <div className="rooms-section">
        <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Rooms</h3>
        <div className="tile-grid">
          {hueState.rooms.map((room) => (
            <div 
              key={room.id} 
              className={`hue-tile ${room.on ? 'active' : ''}`}
              onClick={() => onRoomSelect(room)}
              style={room.on ? ({ '--active-glow': 'radial-gradient(circle at top right, var(--accent-orange), transparent)' } as any) : {}}
            >
              <div className="tile-icon-bg">
                <HueIcon type={room.name} size={28} color={room.on ? 'var(--accent-orange)' : 'var(--text-secondary)'} />
              </div>
              <div>
                <div className="tile-title">{room.name}</div>
                <div className="tile-subtitle">
                  {room.on ? `${room.brightness}% brightness` : 'Off'}
                </div>
              </div>
            </div>
          ))}

          {/* Special All Lights Tile */}
          <div 
            className="hue-tile active"
            style={{ '--active-glow': 'radial-gradient(circle at top right, var(--accent-hue), transparent)' } as any}
          >
            <div className="tile-icon-bg">
              <HueIcon type="group" size={28} color="var(--accent-hue)" />
            </div>
            <div>
              <div className="tile-title">All Lights</div>
              <div className="tile-subtitle">
                {hueState.lights.filter(l => l.on).length} active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
