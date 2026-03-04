import { useEffect, useState } from 'react'
import { Logo } from './Logo'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'appear' | 'glide' | 'curtain'>('appear')

  useEffect(() => {
    // Phase 1: Logo appears and hovers (0 to 1.5s)
    const t1 = setTimeout(() => setPhase('glide'), 1500)
    // Phase 2: Logo glides to top left (1.5s to 2.5s)
    const t2 = setTimeout(() => setPhase('curtain'), 2500)
    // Phase 3: Curtain pulls away, animation complete (2.5s to 3.5s)
    const t3 = setTimeout(() => onComplete(), 3500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  return (
    <div className={`splash-overlay ${phase === 'curtain' ? 'curtain-pull' : ''}`}>
      <div className={`splash-logo-container phase-${phase}`}>
        <Logo />
      </div>
    </div>
  )
}
