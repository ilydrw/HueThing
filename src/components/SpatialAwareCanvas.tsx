import React from 'react';

interface LightNode {
    id: string;
    x: number; // 0-100 normalized
    y: number; // 0-100 normalized
    color: string;
    on: boolean;
}

interface SpatialAwareCanvasProps {
    lights: LightNode[];
}

export default function SpatialAwareCanvas({ lights }: SpatialAwareCanvasProps) {
    // Spatial Gradient Distribution Algorithm
    // This creates a multi-point radial gradient background representing the room's light distribution
    const backgrounds = lights
        .filter(l => l.on)
        .map(l => `radial-gradient(circle at ${l.x}% ${l.y}%, ${l.color} 0%, transparent 70%)`);

    return (
        <div 
            className="spatial-canvas-synthetic"
            style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                background: '#0d0d0f',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: 'inset 0 0 40px rgba(8, 8, 10, 0.8)'
            }}
        >
            {/* Spatial Gradient Layer */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: backgrounds.length > 0 ? backgrounds.join(', ') : '#0a0a0c',
                opacity: 0.6,
                transition: 'all 0.8s ease'
            }} />

            {/* Light Nodes */}
            {lights.map(light => (
                <div
                    key={light.id}
                    style={{
                        position: 'absolute',
                        left: `${light.x}%`,
                        top: `${light.y}%`,
                        width: '40px',
                        height: '40px',
                        background: light.on ? light.color : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: light.on ? `0 0 20px ${light.color}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', opacity: light.on ? 1 : 0.3 }} />
                </div>
            ))}
        </div>
    );
}