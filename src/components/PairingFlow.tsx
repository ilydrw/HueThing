import { useState, useEffect } from 'react'
import { DeskThingClass } from '@deskthing/client'
import { HueState } from '../types'
import Keyboard from './Keyboard'

const deskthing = DeskThingClass.getInstance()

interface PairingFlowProps {
  hueState: HueState
  onPaired: () => void
}

type PairingStep = 'discover' | 'press-button' | 'success' | 'error'

export default function PairingFlow({ hueState, onPaired }: PairingFlowProps) {
  const [step, setStep] = useState<PairingStep>('discover')
  const [bridges, setBridges] = useState<string[]>([])
  const [manualIp, setManualIp] = useState('')
  const [selectedIp, setSelectedIp] = useState('')
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isPairing, setIsPairing] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)

  // If already configured, show as success
  useEffect(() => {
    if (hueState.paired && hueState.connected) {
      setStep('success')
      return
    }

    // Listen for discovery results
    const removeDisco = deskthing.on('hueDiscoverResult', (data: any) => {
      setIsSearching(false)
      if (data?.payload && Array.isArray(data.payload)) {
        setBridges(data.payload)
        if (data.payload.length > 0) {
          setSelectedIp(data.payload[0])
        }
      }
    })

    // Listen for pair results
    const removePair = deskthing.on('huePairStatus', (data: any) => {
      if (data?.payload?.success) {
        setIsPairing(false)
        setStep('success')
      } else if (data?.payload?.error) {
        // "link button not pressed" is logged on server, if we get an error here it's terminal
        if (!data.payload.error.includes('link button')) {
          setError(data.payload.error)
          setIsPairing(false)
          setStep('error')
        }
      }
    })

    return () => {
      removeDisco()
      removePair()
    }
  }, [hueState.paired, hueState.connected])

  const handleDiscover = () => {
    console.log('Client: Sending discover request...')
    setIsSearching(true)
    setError('')
    deskthing.send({ type: 'discover' })
  }

  const handleStartPairing = (ip: string) => {
    setSelectedIp(ip)
    setStep('press-button')
    setIsPairing(true)
    setError('')

    // Tell server to start pairing loop
    deskthing.send({ type: 'pair', payload: { bridgeIp: ip } })
  }

  const renderDiscover = () => (
    <div className="view-container fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'space-between', textAlign: 'center', paddingTop: '10px' }}>
      <div className="title-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <h2 style={{ fontWeight: 400 }}>Setup Bridge</h2>
        <p style={{ fontWeight: 300 }}>Choose a bridge or enter its IP manually to begin.</p>
      </div>

      <div className="pairing-content">
        <div className="found-bridges-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bridges.length === 0 && !isSearching && (
            <div className="empty-state-premium" style={{ marginBottom: '32px' }}>No bridges found automatically.</div>
          )}
          {bridges.map(ip => (
            <button
              key={ip}
              className="card stat-card"
              style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => handleStartPairing(ip)}
            >
              <div>
                <div className="stat-label">Philips Hue Bridge</div>
                <div className="stat-value" style={{ fontSize: '24px' }}>{ip}</div>
              </div>
              <span style={{ fontSize: '24px', opacity: 0.5 }}>→</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pairing-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', flex: 1, justifyContent: 'flex-end', paddingBottom: '20px' }}>
        <button 
          className="action-btn"
          onClick={handleDiscover}
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Scan for Bridges'}
        </button>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '24px', fontWeight: 600, opacity: 0.6, letterSpacing: '2px' }}>or...</div>
        <button className="action-btn secondary" onClick={() => setShowKeyboard(true)}>
          Enter IP Manually
        </button>
      </div>

      {showKeyboard && (
        <Keyboard 
          initialValue={manualIp}
          onInput={setManualIp}
          onDone={() => {
            if (manualIp) {
              handleStartPairing(manualIp)
              setShowKeyboard(false)
            }
          }}
        />
      )}
    </div>
  )

  const renderPressButton = () => (
    <div className="view-container fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'space-between', padding: '20px 0' }}>
      <div className="title-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 400 }}>Pairing Bridge</h2>
        <p style={{ fontWeight: 300 }}>Press the link button on your Hue Bridge to complete the setup.</p>
      </div>
      <div className="pairing-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div
          className="pairing-bridge-icon"
          style={{ animation: 'float 3s ease-in-out infinite', background: 'var(--bg-glass-heavy)', padding: '20px', borderRadius: '50%', border: '2px solid var(--border-glow)' }}
        >
          <img src="/hue-bridge.svg" alt="Hue Bridge" style={{ width: '80px', height: '80px' }} />
        </div>
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: '700' }}>Bridge IP: {selectedIp}</p>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Waiting for link button press...</p>
        </div>
        <button
          className="action-btn secondary"
          style={{ marginTop: '40px', width: 'auto', padding: '0 48px' }}
          onClick={() => {
            deskthing.send({ type: 'cancelPairing' })
            setIsPairing(false)
            setStep('discover')
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="view-container fade-in">
      <div className="pairing-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="pairing-bridge-icon" style={{ background: 'linear-gradient(135deg, var(--accent-green), #03251a)', padding: '24px', borderRadius: '50%', border: '2px solid var(--accent-green)', boxShadow: '0 0 40px rgba(50, 215, 75, 0.3)' }}>
          <img src="/hue-bridge.svg" alt="Hue Bridge" style={{ width: '80px', height: '80px', filter: 'brightness(0) invert(1)' }} />
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: '900', marginTop: '32px' }}>Connected!</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '18px', textAlign: 'center' }}>
          Successfully connected to your Hue Bridge.
          <br />
          {hueState.lights.length > 0
            ? `Found ${hueState.lights.length} lights in ${hueState.rooms.length} rooms.`
            : 'Loading your lights...'}
        </p>
        <button className="action-btn" style={{ marginTop: '40px', width: 'auto', padding: '0 48px' }} onClick={onPaired}>
          Start Controlling Lights →
        </button>
      </div>
    </div>
  )

  const renderError = () => (
    <div className="view-container fade-in">
      <div className="pairing-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="pairing-bridge-icon" style={{ background: 'linear-gradient(135deg, var(--accent-red), #350a0a)', padding: '24px', borderRadius: '50%', border: '2px solid var(--accent-red)', boxShadow: '0 0 40px rgba(255, 69, 58, 0.3)' }}>
          <img src="/hue-bridge.svg" alt="Hue Bridge" style={{ width: '80px', height: '80px', filter: 'brightness(0) invert(1)' }} />
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: '900', marginTop: '32px' }}>Connection Failed</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '18px', textAlign: 'center', maxWidth: '400px' }}>
          {error || 'Could not connect to the Hue Bridge. Please try again.'}
        </p>
        <button className="action-btn" style={{ marginTop: '40px', width: 'auto', padding: '0 48px' }} onClick={() => setStep('discover')}>
          Try Again
        </button>
      </div>
    </div>
  )

  switch (step) {
    case 'discover': return renderDiscover()
    case 'press-button': return renderPressButton()
    case 'success': return renderSuccess()
    case 'error': return renderError()
  }
}
