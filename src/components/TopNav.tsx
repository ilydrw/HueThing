import React, { useEffect, useRef, useState } from 'react';
import { carThingLayout } from '../theme/carThing';

const HomeIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.25 12 3l9 7.25" />
    <path d="M5 9.75V20h14V9.75" />
  </svg>
);

const SyncIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6.5" width="18" height="12" rx="2" />
    <path d="M9 3.5 12 6.5 15 3.5" />
  </svg>
);

interface TopNavProps {
  activeTab: 'home' | 'sync';
  onTabChange: (tab: 'home' | 'sync') => void;
  scrollOffset: number;
  connected: boolean;
  bridgeLabel?: string;
}

export default function TopNav({ activeTab, onTabChange, scrollOffset, connected, bridgeLabel }: TopNavProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const diff = scrollOffset - lastScrollY.current;
    if (diff < -2 || scrollOffset < 5) {
      setIsVisible(true);
    } else if (diff > 10 && scrollOffset > 50) {
      setIsVisible(false);
    }
    lastScrollY.current = scrollOffset;
  }, [scrollOffset]);

  const tabs = [
    { id: 'home', label: 'Home', Icon: HomeIcon },
    { id: 'sync', label: 'Sync', Icon: SyncIcon }
  ] as const;

  return (
      <nav
        className={`hue-topbar ${isVisible ? 'is-visible' : 'is-hidden'}`}
        style={{
          top: `${carThingLayout.nav.top}px`,
          left: `${carThingLayout.nav.left}px`
        }}
        aria-label="Primary"
      >
        <div className="hue-topbar__brand" aria-label="HueThing">
          <span className="hue-topbar__brand-mark" aria-hidden="true" />
          <span>HueThing</span>
        </div>

        <div className="hue-topbar__tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`hue-topbar__tab ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.Icon color="currentColor" />
              <span>{tab.label}</span>
            </button>
          );
        })}
        </div>

        <div className={`hue-topbar__status ${connected ? 'is-online' : ''}`}>
          <span className="hue-topbar__status-dot" aria-hidden="true" />
          <span>{connected ? (bridgeLabel || 'Bridge connected') : 'Bridge offline'}</span>
        </div>
      </nav>
  );
}
