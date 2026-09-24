import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SyncArea } from '../types';
import { useHueStoreActions, useHueStoreState } from '../state';
import TogglePill from './TogglePill';

interface SyncDashboardProps {
  entertainmentAreas: SyncArea[];
}

const STREAM_FRAME_MS = 1000 / 30;

export default function SyncDashboard({ entertainmentAreas }: SyncDashboardProps) {
  const { syncStatus, syncError } = useHueStoreState();
  const actions = useHueStoreActions();
  const [activeAreaId, setActiveAreaId] = useState<string | null>(syncStatus.areaId);
  const [isSyncing, setIsSyncing] = useState(syncStatus.active);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const lastFrameRef = useRef(0);

  useEffect(() => {
    setIsSyncing(syncStatus.active);
    setActiveAreaId(syncStatus.areaId || null);
  }, [syncStatus.active, syncStatus.areaId]);

  useEffect(() => () => {
    if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
  }, []);

  const streamMood = useCallback((frameTime: number) => {
    if (!isSyncing || !activeAreaId) return;

    if (frameTime - lastFrameRef.current < STREAM_FRAME_MS) {
      requestRef.current = requestAnimationFrame(streamMood);
      return;
    }
    lastFrameRef.current = frameTime;

    const area = entertainmentAreas.find((candidate) => candidate.id === activeAreaId);
    if (!area) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const updates = area.locations.map((location, index) => {
      const numericId = Number.parseInt(location.lightId.split('/').pop() || '0', 10);
      return {
        id: numericId,
        color: {
          r: Math.floor(127 + (128 * Math.sin(elapsed + index))),
          g: Math.floor(127 + (128 * Math.sin(elapsed + index + 2))),
          b: Math.floor(127 + (128 * Math.sin(elapsed + index + 4)))
        }
      };
    }).filter((update) => update.id > 0);

    actions.sendSyncData(updates);
    requestRef.current = requestAnimationFrame(streamMood);
  }, [actions, activeAreaId, entertainmentAreas, isSyncing]);

  useEffect(() => {
    if (isSyncing) {
      startTimeRef.current = Date.now();
      lastFrameRef.current = 0;
      requestRef.current = requestAnimationFrame(streamMood);
    } else if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, [isSyncing, streamMood]);

  const toggleSync = (areaId: string) => {
    if (isSyncing && activeAreaId === areaId) {
      actions.stopSync(areaId);
    } else {
      actions.startSync(areaId);
    }
  };

  return (
    <div className="hue-page hue-sync-page no-scrollbar">
      <header className="hue-page-header hue-page-header--sync">
        <div>
          <p className="hue-eyebrow">Hue Entertainment</p>
          <h1>Sync</h1>
        </div>
        <div className={`hue-sync-state ${isSyncing ? 'is-live' : ''}`}>
          <span aria-hidden="true" />
          {isSyncing ? 'Streaming' : 'Ready'}
        </div>
      </header>

      <div className="hue-sync-intro">
        <div className="hue-sync-intro__art" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div>
          <strong>Fill the room with color</strong>
          <span>Start a smooth ambient color loop across an Entertainment area.</span>
        </div>
      </div>

      {syncError && (
        <div className="hue-error-banner" role="alert">
          <strong>Sync could not start</strong>
          <span>{syncError}</span>
        </div>
      )}

      <section>
        <div className="hue-section-heading">
          <div>
            <p className="hue-eyebrow">Choose an area</p>
            <h2>Entertainment areas</h2>
          </div>
          <span>{entertainmentAreas.length} available</span>
        </div>

        {entertainmentAreas.length > 0 ? (
          <div className="hue-sync-grid">
            {entertainmentAreas.map((area) => {
              const isActive = activeAreaId === area.id && isSyncing;
              return (
                <article key={area.id} className={`hue-sync-card ${isActive ? 'is-live' : ''}`}>
                  <div className="hue-sync-card__icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M7 15c2-4 4-6 6-6s3 2 4 4" />
                    </svg>
                  </div>
                  <div className="hue-sync-card__copy">
                    <strong>{area.name}</strong>
                    <span>{area.locations.length} configured lights</span>
                  </div>
                  <TogglePill checked={isActive} onToggle={() => toggleSync(area.id)} label={`Toggle sync for ${area.name}`} />
                  {isActive && <span className="hue-sync-card__live-label">Live</span>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="hue-empty-state">
            <strong>No Entertainment areas</strong>
            <span>Create one in the Hue app, then refresh this page.</span>
            <button type="button" onClick={actions.refreshSyncAreas}>Refresh</button>
          </div>
        )}
      </section>
    </div>
  );
}
