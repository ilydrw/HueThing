import React from 'react';
import { hueTokens } from '../theme/hueTokens';
import type { AppRoute, AppSurface } from './navigation';

interface AppShellProps {
  route: AppRoute;
  connected: boolean;
  bridgeLabel?: string;
  onNavigate: (route: AppRoute) => void;
  children: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 10.5 9-7 9 7" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10l-2.5-2.5" />
      <path d="M17 17H7l2.5 2.5" />
      <path d="M17 7a7 7 0 0 1 1.7 7.2" />
      <path d="M7 17a7 7 0 0 1-1.7-7.2" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function surfaceLabel(surface: AppSurface) {
  if (surface === 'sync') return 'Sync';
  if (surface === 'room') return 'Room';
  return 'Home';
}

export default function AppShell({
  route,
  connected,
  bridgeLabel,
  onNavigate,
  children
}: AppShellProps) {
  const isHome = route.surface === 'home';

  // Room detail still owns its header during the incremental migration. This
  // prevents two navigation bars while preserving its current interactions.
  if (route.surface === 'room') {
    return <>{children}</>;
  }

  return (
    <div
      className="hue-app-shell"
      style={{ '--hue-shell-height': `${hueTokens.shell.headerHeight}px` } as React.CSSProperties}
    >
      <header className="hue-shell-header">
        <div className="hue-shell-header__leading">
          {!isHome && (
            <button
              type="button"
              className="hue-shell-icon-button"
              onClick={() => onNavigate({ surface: 'home' })}
              aria-label="Back to Home"
            >
              <BackIcon />
            </button>
          )}

          <div className="hue-shell-brand" aria-label="HueThing">
            <span className="hue-shell-brand__mark" aria-hidden="true" />
            <div>
              <span className="hue-shell-brand__eyebrow">HueThing</span>
              <strong>{surfaceLabel(route.surface)}</strong>
            </div>
          </div>
        </div>

        <div className="hue-shell-header__actions">
          <nav className="hue-shell-nav" aria-label="Primary">
            <button
              type="button"
              className={`hue-shell-nav__item ${isHome ? 'is-active' : ''}`}
              onClick={() => onNavigate({ surface: 'home' })}
              aria-current={isHome ? 'page' : undefined}
            >
              <HomeIcon />
              <span>Home</span>
            </button>
            <button
              type="button"
              className={`hue-shell-nav__item ${route.surface === 'sync' ? 'is-active' : ''}`}
              onClick={() => onNavigate({ surface: 'sync' })}
              aria-current={route.surface === 'sync' ? 'page' : undefined}
            >
              <SyncIcon />
              <span>Sync</span>
            </button>
          </nav>

          <div className={`hue-shell-status ${connected ? 'is-online' : ''}`} title={bridgeLabel || undefined}>
            <span className="hue-shell-status__dot" aria-hidden="true" />
            <span>{connected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </header>

      <div className="hue-shell-content">{children}</div>
    </div>
  );
}
