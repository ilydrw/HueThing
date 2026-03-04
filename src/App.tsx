import { useState, useEffect, useCallback, useRef } from 'react'
import { DeskThingClass } from '@deskthing/client'
import { HueState, SimplifiedRoom, SimplifiedLight } from './types'
import Dashboard from './components/Dashboard'
import LightControl from './components/LightControl'
import ScenePicker from './components/ScenePicker'
import PairingFlow from './components/PairingFlow'
import ColorPicker from './components/ColorPicker'
import { HueIcon } from './components/HueIcons'
import { Logo } from './components/Logo'

type View = 'dashboard' | 'lights' | 'scenes' | 'pairing'

const deskthing = DeskThingClass.getInstance()

export default function App() {
  const [hueState, setHueState] = useState<HueState>({
    connected: false,
    paired: false,
    bridgeIp: '',
    lights: [],
    rooms: [],
    scenes: []
  })

  const [view, setView] = useState<View>('dashboard')
  const [selectedRoom, setSelectedRoom] = useState<SimplifiedRoom | null>(null)
  const [pickingColorLight, setPickingColorLight] = useState<SimplifiedLight | null>(null)
  const [knobBrightness, setKnobBrightness] = useState<number | null>(null)
  const [themeColor, setThemeColor] = useState<string>('#bf5af2')
  const knobTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Refs to avoid closure staleness in event listeners
  const selectedRoomRef = useRef<SimplifiedRoom | null>(null)
  const knobStepRef = useRef<number>(5)

  // Sync refs with state
  useEffect(() => {
    selectedRoomRef.current = selectedRoom
  }, [selectedRoom])

  // Listen for state updates from server
  useEffect(() => {
    const removeHueState = deskthing.on('hueState', (data: any) => {
      if (data?.payload) {
        setHueState(data.payload as HueState)

        // Auto-redirect to pairing if not paired
        if (!data.payload.paired && !data.payload.connected) {
          setView('pairing')
        }

        // Update selected room if it exists
        if (selectedRoom) {
          const updatedRoom = (data.payload as HueState).rooms.find(r => r.id === selectedRoom.id)
          if (updatedRoom) setSelectedRoom(updatedRoom)
        }
      }
    })

    // Listen for brightness feedback from server (knob turns)
    const removeBrightness = deskthing.on('hueBrightness', (data: any) => {
      if (data?.payload?.brightness !== undefined) {
        setKnobBrightness(Math.round(data.payload.brightness))
        // Auto-hide the indicator after 1.5 seconds
        if (knobTimeoutRef.current) clearTimeout(knobTimeoutRef.current)
        knobTimeoutRef.current = setTimeout(() => setKnobBrightness(null), 1500)
      }
    })

    // Listen for Car Thing knob scroll events (volume knob → brightness)
    const removeScrollUp = deskthing.on('scrollUp' as any, () => {
      deskthing.send({
        type: 'brightnessUp',
        payload: { roomId: selectedRoomRef.current?.id }
      })
    })

    const removeScrollDown = deskthing.on('scrollDown' as any, () => {
      deskthing.send({
        type: 'brightnessDown',
        payload: { roomId: selectedRoomRef.current?.id }
      })
    })

    // Knob press → toggle all lights
    const removeKnobPress = deskthing.on('pressShort' as any, () => {
      deskthing.send({ type: 'knobPress' })
    })

    // Also handle wheel events for browser testing
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) {
        deskthing.send({ type: 'brightnessUp', payload: { roomId: selectedRoomRef.current?.id } })
      } else {
        deskthing.send({ type: 'brightnessDown', payload: { roomId: selectedRoomRef.current?.id } })
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })

    // Listen to settings for theme change
    const removeSettings = deskthing.on('settings', (data: any) => {
      if (data?.payload?.themeColor?.value) {
        setThemeColor(data.payload.themeColor.value as string)
      }
      if (data?.payload?.knobStep?.value) {
        knobStepRef.current = Number(data.payload.knobStep.value)
      }
    })

    // Request initial state and settings
    deskthing.send({ type: 'getState' })
    deskthing.send({ type: 'getSettings' })

    return () => {
      removeHueState()
      removeBrightness()
      removeScrollUp()
      removeScrollDown()
      removeKnobPress()
      removeSettings()
      window.removeEventListener('wheel', handleWheel)
      if (knobTimeoutRef.current) clearTimeout(knobTimeoutRef.current)
    }
  }, [])

  const handleRoomSelect = useCallback((room: SimplifiedRoom) => {
    setSelectedRoom(room)
    setView('lights')
  }, [])

  const handleBack = useCallback(() => {
    setView('dashboard')
    setSelectedRoom(null)
  }, [])

  const handlePaired = useCallback(() => {
    setView('dashboard')
  }, [])

  const handlePickColor = useCallback((light: SimplifiedLight) => {
    setPickingColorLight(light)
  }, [])

  const handleViewScenes = useCallback((room: SimplifiedRoom) => {
    setSelectedRoom(room)
    setView('scenes')
  }, [])

  const needsPairing = !hueState.paired && !hueState.connected

  return (
    <div className="app-container" style={{ '--accent-hue': themeColor } as React.CSSProperties}>
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <Logo />
        </div>
        {!needsPairing && (
          <div className="header-status">
            <span className={`status-dot ${hueState.connected ? '' : 'disconnected'}`} />
            {hueState.connected ? `${hueState.lights.length} Lights` : 'Offline'}
          </div>
        )}
      </header>

      {!needsPairing && (
        <nav className="nav-bar">
          <button
            className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setView('dashboard'); setSelectedRoom(null) }}
          >
            <span className="nav-item-icon">
              <HueIcon type="room" size={32} color={view === 'dashboard' ? 'var(--accent-hue)' : 'var(--text-muted)'} />
            </span>
            <span className="nav-item-label">Rooms</span>
          </button>
          <button
            className={`nav-item ${view === 'lights' ? 'active' : ''}`}
            onClick={() => {
              if (!selectedRoom && hueState.rooms.length > 0) {
                setSelectedRoom(hueState.rooms[0])
              }
              setView('lights')
            }}
          >
            <span className="nav-item-icon">
              <HueIcon type="bulb" size={32} color={view === 'lights' ? 'var(--accent-hue)' : 'var(--text-muted)'} />
            </span>
            <span className="nav-item-label">Lights</span>
          </button>
          <button
            className={`nav-item ${view === 'scenes' ? 'active' : ''}`}
            onClick={() => {
              if (!selectedRoom && hueState.rooms.length > 0) {
                setSelectedRoom(hueState.rooms[0])
              }
              setView('scenes')
            }}
          >
            <span className="nav-item-icon">
              <HueIcon type="filament" size={32} color={view === 'scenes' ? 'var(--accent-hue)' : 'var(--text-muted)'} />
            </span>
            <span className="nav-item-label">Scenes</span>
          </button>
          <button
            className={`nav-item ${view === 'pairing' ? 'active' : ''}`}
            onClick={() => setView('pairing')}
          >
            <span className="nav-item-icon">
              <HueIcon type="group" size={32} color={view === 'pairing' ? 'var(--accent-hue)' : 'var(--text-muted)'} />
            </span>
            <span className="nav-item-label">Setup</span>
          </button>
        </nav>
      )}

      {/* Content */}
      <div className="app-content">
        {needsPairing || view === 'pairing' ? (
          <PairingFlow
            hueState={hueState}
            onPaired={handlePaired}
          />
        ) : view === 'dashboard' ? (
          <Dashboard
            hueState={hueState}
            onRoomSelect={handleRoomSelect}
            onViewScenes={handleViewScenes}
          />
        ) : view === 'lights' && selectedRoom ? (
          <LightControl
            room={selectedRoom}
            lights={hueState.lights.filter(l => selectedRoom.lightIds.includes(l.id))}
            onBack={handleBack}
            onPickColor={handlePickColor}
          />
        ) : view === 'scenes' && selectedRoom ? (
          <ScenePicker
            room={selectedRoom}
            scenes={hueState.scenes.filter(s => s.roomId === selectedRoom.id)}
            rooms={hueState.rooms}
            onBack={handleBack}
            onRoomChange={(room) => setSelectedRoom(room)}
          />
        ) : (
          <Dashboard
            hueState={hueState}
            onRoomSelect={handleRoomSelect}
            onViewScenes={handleViewScenes}
          />
        )}
      </div>

      {/* Brightness Indicator Overlay — appears when turning the knob */}
      {knobBrightness !== null && (
        <div className="knob-overlay">
          <div className="knob-value">{knobBrightness}%</div>
          <div className="knob-label">Brightness</div>
        </div>
      )}

      {/* Color Picker Full Screen Overlay */}
      {pickingColorLight && (
        <ColorPicker
          light={pickingColorLight}
          onClose={() => setPickingColorLight(null)}
        />
      )}
    </div>
  )
}
