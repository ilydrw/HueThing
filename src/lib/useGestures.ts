/* src/hooks/useGestures.ts */
import { useMemo, useEffect } from 'react';
import { GestureArena, TapSliderRecognizer } from '../lib/GestureEngine';

export function useSliderGestures(onUpdate: (dx: number) => void, onEnd: () => void) {
    const arena = useMemo(() => new GestureArena(), []);

    const recognizer = useMemo(() => new TapSliderRecognizer({
        onSliderUpdate: onUpdate,
        onSliderEnd: onEnd,
        onTap: () => { } // Optional: add toggle logic here
    }), [onUpdate, onEnd]);

    useEffect(() => {
        arena.addRecognizer(recognizer);
    }, [arena, recognizer]);

    return (e: React.PointerEvent) => {
        arena.handleEvent(e.nativeEvent, e.currentTarget as HTMLElement);
    };
}
