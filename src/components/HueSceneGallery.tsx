import React from 'react';
import type { SimplifiedScene } from '../types';
import { formatHueScene } from '../lib/HueSceneEngine';

export const HueSceneGallery = ({
  scenes,
  onSelect,
  focusedSceneId
}: {
  scenes: SimplifiedScene[];
  onSelect: (id: string) => void;
  focusedSceneId?: string | null;
}) => {
  return (
    <div className="hue-scene-gallery no-scrollbar">
      {scenes.map((s) => {
        const theme = formatHueScene(s);
        const gradient = theme.colors.length > 1 
          ? `linear-gradient(135deg, ${theme.colors.join(', ')})`
          : theme.colors[0];

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`hue-scene-card ${focusedSceneId === s.id ? 'is-focused' : ''}`}
            aria-current={focusedSceneId === s.id ? 'true' : undefined}
            aria-label={`Activate ${theme.name}`}
          >
            <span className="hue-scene-card__palette" style={{ background: gradient }} />
            <span>{theme.name}</span>
          </button>
        );
      })}
    </div>
  );
};
