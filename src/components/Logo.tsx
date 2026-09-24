import React from 'react'

interface LogoProps {
  iconSize?: number
  textSize?: number
  thingClassName?: string
}

/**
 * Logo Component
 * Optimized for Chrome 69+ 
 * Designed to be scaled via parent container for 800x480 Rule of Thirds alignment.
 */
export const Logo: React.FC<LogoProps> = ({
  iconSize = 64,
  textSize = 32,
  thingClassName = ''
}) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0px', 
        flexDirection: 'row',
        flexShrink: 0,
        userSelect: 'none'
      }}
    >
      {/* Animated Icon Portion */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="rainbowFlow" x1="0%" y1="0%" x2="100%" y2="0%" spreadMethod="repeat">
            <stop offset="0%" stopColor="#E81A24" />
            <stop offset="16.6%" stopColor="#F26E22" />
            <stop offset="33.3%" stopColor="#F4B214" />
            <stop offset="50%" stopColor="#2CB34A" />
            <stop offset="66.6%" stopColor="#009DDE" />
            <stop offset="83.3%" stopColor="#1F3F98" />
            <stop offset="100%" stopColor="#E81A24" />
            
            {/* SMIL Animation: Supported in Chrome 69 for SVG gradient shifting */}
            <animate attributeName="x1" values="0%;-100%" dur="4s" repeatCount="indefinite" />
            <animate attributeName="x2" values="100%;0%" dur="4s" repeatCount="indefinite" />
          </linearGradient>
        </defs>
        
        {/* The solid white "hue" container */}
        <path d="M 12 12 H 88 V 50 C 88 88, 88 88, 50 88 H 12 Z" fill="white" />
        
        {/* The "hue" text punchout filled with the animated gradient */}
        <g transform="translate(18, 20) scale(2.8)">
          <path 
            d="M20.672 9.6c-2.043 0-3.505 1.386-3.682 3.416h-.664c-.247 0-.395.144-.395.384 0 .24.148.384.395.384h.661c.152 2.09 1.652 3.423 3.915 3.423.944 0 1.685-.144 2.332-.453.158-.075.337-.217.292-.471a.334.334 0 0 0-.15-.242c-.104-.065-.25-.072-.422-.02a7.93 7.93 0 0 0-.352.12c-.414.146-.771.273-1.599.273-1.75 0-2.908-1.023-2.952-2.605v-.025h5.444c.313 0 .492-.164.505-.463v-.058C23.994 9.865 21.452 9.6 20.672 9.6zm2.376 3.416h-5l.004-.035c.121-1.58 1.161-2.601 2.649-2.601 1.134 0 2.347.685 2.347 2.606zM9.542 10.221c0-.335-.195-.534-.52-.534s-.52.2-.52.534v2.795h1.04zm4.29 3.817c0 1.324-.948 2.361-2.16 2.361-1.433 0-2.13-.763-2.13-2.333v-.282h-1.04v.34c0 2.046.965 3.083 2.868 3.083 1.12 0 1.943-.486 2.443-1.445l.02-.036v.861c0 .334.193.534.519.534.325 0 .52-.2.52-.534v-2.803h-1.04zm.52-4.351c-.326 0-.52.2-.52.534v2.795h1.04v-2.795c0-.335-.195-.534-.52-.534zM3.645 9.6c-1.66 0-2.31 1.072-2.471 1.4l-.135.278V7.355c0-.347-.199-.562-.52-.562-.32 0-.519.215-.519.562v5.661h1.039v-.015c0-1.249.72-2.592 2.304-2.592 1.29 0 2.001.828 2.001 2.332v.275h1.04v-.246c0-2.044-.973-3.17-2.739-3.17zM0 16.558c0 .347.199.563.52.563.32 0 .519-.216.519-.563v-2.774H0zm5.344 0c0 .347.2.563.52.563s.52-.216.52-.563v-2.774h-1.04z" 
            fill="url(#rainbowFlow)" 
          />
        </g>
      </svg>
      
      {/* Text Portion */}
      <h1 style={{ 
        margin: 0, 
        padding: 0,
        display: 'flex', 
        alignItems: 'center', 
        marginLeft: '-4px' 
      }}>
        <span 
          className={thingClassName}
          style={{ 
            fontWeight: 500, 
            color: '#ffffff', 
            letterSpacing: '-1.5px', 
            fontSize: `${textSize}px`, 
            whiteSpace: 'nowrap',
            fontFamily: '"Centra No2", "Centra No2 Medium", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
          }}
        >
          Thing.
        </span>
      </h1>
    </div>
  )
}
