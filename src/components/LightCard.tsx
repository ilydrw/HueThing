import React, { useRef, useState, useMemo, useEffect } from 'react';
import { TapSliderRecognizer, GestureArena } from '../lib/GestureEngine';
import { HueIcon } from './HueIcons';

interface LightCardProps {
  id: string;
  name: string;
  isOn: boolean;
  brightness: number; // 0-100 range from server
  onToggle: (id: string) => void;
  onBrightnessChange: (id: string, brightness: number) => void;
  onLongPress?: () => void;
}

export default function LightCard({ 
  id, name, isOn, brightness, onToggle, onBrightnessChange, onLongPress 
}: LightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // tempB provides the low-latency preview during the swipe
  const [tempB, setTempB] = useState<number | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  // Derived state: Use the live swipe value if dragging, otherwise use the server value
  const displayB = tempB !== null ? tempB : brightness;
  const isDragging = tempB !== null;

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const arena = useMemo(() => {
    const a = new GestureArena();
    a.addRecognizer(new TapSliderRecognizer({
      onTap: () => onToggle(id),
      onSliderUpdate: (dx) => {
        const width = cardRef.current?.offsetWidth || 1;
        // Calculation: Map pixel delta to the 0-100 scale relative to start position
        const next = Math.max(0, Math.min(100, brightness + (dx / width) * 100));
        setTempB(next);
      },
      onSliderEnd: () => {
        setTempB((val) => {
          if (val !== null) onBrightnessChange(id, Math.round(val));
          return null; // Commit to server and revert to prop-driven state
        });
      },
      onSliderCancel: () => {
        setTempB(null);
      }
    }));
    return a;
  }, [id, brightness, onToggle, onBrightnessChange]);

  const handlePointer = (e: React.PointerEvent) => {
    const event = e.nativeEvent;

    if (e.type === 'pointerdown') {
      setIsPressed(true);
      longPressTimer.current = setTimeout(() => {
        if (!isDragging && onLongPress) {
          onLongPress();
          setIsPressed(false);
        }
      }, 600);
    } 
    
    if (e.type === 'pointermove') {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (e.type === 'pointerup' || e.type === 'pointercancel') {
      setIsPressed(false);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    arena.handleEvent(event, e.currentTarget as HTMLDivElement);
  };

  return (
    <div 
      ref={cardRef}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerUp={handlePointer}
      onPointerCancel={handlePointer}
      style={{
        position: 'relative',
        height: '80px',
        width: '100%',
        borderRadius: '16px',
        background: isOn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isOn ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
        // Dynamic Glow: The shadow spreads further and brightens as displayB increases
        boxShadow: isOn 
          ? `0 8px 24px rgba(255, 255, 255, ${0.05 + (displayB / 100) * 0.15})` 
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        cursor: 'pointer',
        touchAction: 'pan-y',
        transform: (isPressed || isDragging) ? 'scale(0.98)' : 'scale(1)',
        transition: isDragging 
          ? 'transform 0.1s ease-out' 
          : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease'
      }}
    >
      {/* Liquid Fill Logic: Removing transitions during 'isDragging' makes the bar 1:1 with finger movement */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: `${isOn ? displayB : 0}%`,
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.12) 100%)',
          transition: isDragging ? 'none' : 'width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
          pointerEvents: 'none',
          borderRight: isOn ? '1px solid rgba(255, 255, 255, 0.4)' : 'none'
        }} 
      />
      
      {/* Highlight Layer for added depth */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        padding: '0 20px',
        gap: '16px',
        pointerEvents: 'none'
      }}>
        {/* The Icon color dims/brightens based on displayB */}
        <HueIcon 
          type="bulb" 
          size={24} 
          color={isOn ? `rgba(255, 255, 255, ${0.4 + (displayB / 100) * 0.6})` : "rgba(255, 255, 255, 0.25)"} 
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ color: isOn ? '#fff' : 'rgba(255, 255, 255, 0.5)', fontSize: '18px', fontWeight: 600 }}>
              {name}
            </div>
            <div style={{ color: isOn ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)', fontSize: '14px', fontWeight: 500 }}>
              {isOn ? `${Math.round(displayB)}%` : 'Off'}
            </div>
        </div>

        {/* Status Toggle */}
        <div style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            backgroundColor: isOn ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.1)',
            position: 'relative',
            transition: 'all 0.3s ease'
        }}>
            <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: isOn ? '#010417' : '#ffffff',
                position: 'absolute',
                top: '3px',
                left: isOn ? '23px' : '3px',
                transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
        </div>
      </div>
    </div>
  );
}
