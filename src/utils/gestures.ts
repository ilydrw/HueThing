/**
 * Gesture Recognition State Machine (GRSM) Core
 * Implementation based on Intent-Aware Interaction Framework
 */

export enum GestureState {
    POSSIBLE,
    BEGAN,
    CHANGED,
    ENDED,
    FAILED,
    CANCELLED
}

export abstract class GestureRecognizer {
    public state: GestureState = GestureState.POSSIBLE;
    protected touchSlop = 10;

    abstract process(event: PointerEvent, allPointers: PointerEvent[]): void;
    abstract reset(): void;
}

export class GestureArena {
    private recognizers: Set<GestureRecognizer> = new Set();
    private activePointers: Map<number, PointerEvent> = new Map();
    private winner: GestureRecognizer | null = null;

    addRecognizer(recognizer: GestureRecognizer) {
        this.recognizers.add(recognizer);
        return this;
    }

    handleEvent(event: PointerEvent) {
        if (event.type === 'pointerdown') {
            this.activePointers.set(event.pointerId, event);
            // (event.target as HTMLElement).setPointerCapture(event.pointerId);
        } else if (event.type === 'pointerup' || event.type === 'pointercancel') {
            this.activePointers.delete(event.pointerId);
        } else if (event.type === 'pointermove') {
            this.activePointers.set(event.pointerId, event);
        }

        const allPointers = Array.from(this.activePointers.values());

        if (this.winner) {
            this.winner.process(event, allPointers);
            if (this.winner.state === GestureState.ENDED || this.winner.state === GestureState.FAILED || this.winner.state === GestureState.CANCELLED) {
                this.reset();
            }
            return;
        }

        const competing = Array.from(this.recognizers);
        for (const recognizer of competing) {
            recognizer.process(event, allPointers);

            if (recognizer.state === GestureState.BEGAN) {
                this.declareWinner(recognizer);
                break;
            }
        }

        if (event.type === 'pointerup' && !this.winner) {
            this.reset();
        }
    }

    private declareWinner(winner: GestureRecognizer) {
        this.winner = winner;
        for (const recognizer of this.recognizers) {
            if (recognizer !== winner) {
                recognizer.reset(); // Force fail competitors
            }
        }
    }

    reset() {
        this.winner = null;
        this.recognizers.forEach(r => r.reset());
    }
}

/**
 * Enhanced Hue Widget Recognizer
 * Disambiguates between:
 * - Tap: Instant releases
 * - Drag/Began: Brightness change (after 300ms hold OR move)
 * - Long Press: Color picker (after 800ms)
 */
export class HueWidgetRecognizer extends GestureRecognizer {
    private startTime: number = 0;
    private startX: number = 0;
    private startY: number = 0;
    private lastX: number = 0;
    private lastTime: number = 0;
    private velocity: number = 0;
    private dragTimer: any;
    private longPressTimer: any;

    constructor(
        private callbacks: {
            onTap: () => void;
            onDragUpdate: (percentage: number, velocity: number) => void;
            onDragEnd: (percentage: number) => void;
            onLongPress: () => void;
            getBoundingRect: () => DOMRect;
        }
    ) {
        super();
    }

    process(event: PointerEvent, allPointers: PointerEvent[]) {
        const currentTime = Date.now();

        if (allPointers.length > 1) {
            this.state = GestureState.FAILED;
            return;
        }

        switch (event.type) {
            case 'pointerdown':
                this.startTime = currentTime;
                this.startX = event.clientX;
                this.startY = event.clientY;
                this.lastX = event.clientX;
                this.lastTime = currentTime;
                this.velocity = 0;
                this.state = GestureState.POSSIBLE;

                this.dragTimer = setTimeout(() => {
                    if (this.state === GestureState.POSSIBLE) {
                        this.state = GestureState.BEGAN;
                        this.cleanupLongPress();
                        this.updateValue(event.clientX, 0);
                    }
                }, 300);

                this.longPressTimer = setTimeout(() => {
                    if (this.state === GestureState.POSSIBLE) {
                        this.state = GestureState.ENDED;
                        this.cleanupDrag();
                        this.callbacks.onLongPress();
                    }
                }, 800);
                break;

            case 'pointermove':
                const dx = event.clientX - this.startX;
                const dy = Math.abs(event.clientY - this.startY);
                const dt = currentTime - this.lastTime;

                // Calculate velocity (pixels per ms)
                if (dt > 0) {
                    const instantaneousVelocity = (event.clientX - this.lastX) / dt;
                    // Apply a small amount of smoothing to the velocity
                    this.velocity = this.velocity * 0.4 + instantaneousVelocity * 0.6;
                }
                this.lastX = event.clientX;
                this.lastTime = currentTime;

                if (this.state === GestureState.POSSIBLE) {
                    if (Math.abs(dx) > this.touchSlop || dy > this.touchSlop) {
                        // Disambiguate: If primarily vertical, fail to allow page scrolling
                        if (dy > Math.abs(dx)) {
                            this.state = GestureState.FAILED;
                            this.cleanup();
                            return;
                        }
                        this.cleanupDrag();
                        this.cleanupLongPress();
                        this.state = GestureState.BEGAN;
                        this.updateValue(event.clientX, this.velocity);
                    }
                } else if (this.state === GestureState.BEGAN || this.state === GestureState.CHANGED) {
                    this.cleanupLongPress();
                    this.state = GestureState.CHANGED;
                    this.updateValue(event.clientX, this.velocity);
                }
                break;

            case 'pointerup':
                this.cleanup();
                if (this.state === GestureState.POSSIBLE) {
                    this.callbacks.onTap();
                } else if (this.state === GestureState.BEGAN || this.state === GestureState.CHANGED) {
                    this.callbacks.onDragEnd(this.calculatePercentage(event.clientX));
                }
                this.state = GestureState.ENDED;
                break;

            case 'pointercancel':
                this.cleanup();
                this.state = GestureState.CANCELLED;
                break;
        }
    }

    private updateValue(clientX: number, velocity: number) {
        this.callbacks.onDragUpdate(this.calculatePercentage(clientX), velocity);
    }

    private calculatePercentage(clientX: number): number {
        const rect = this.callbacks.getBoundingRect();
        if (rect.width === 0) return 1;
        let p = ((clientX - rect.left) / rect.width) * 100;
        return Math.max(1, Math.min(100, Math.round(p)));
    }

    private cleanupDrag() {
        if (this.dragTimer) {
            clearTimeout(this.dragTimer);
            this.dragTimer = null;
        }
    }

    private cleanupLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    private cleanup() {
        this.cleanupDrag();
        this.cleanupLongPress();
    }

    reset() {
        this.cleanup();
        this.state = GestureState.POSSIBLE;
    }
}
