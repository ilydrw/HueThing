export enum GestureState { POSSIBLE, BEGAN, CHANGED, ENDED, FAILED, CANCELLED }

export abstract class GestureRecognizer {
    public state: GestureState = GestureState.POSSIBLE;
    protected touchSlop = 10;
    abstract process(event: PointerEvent, allPointers: PointerEvent[]): void;
    reset() { this.state = GestureState.POSSIBLE; }
}

export class GestureArena {
    private recognizers: Set<GestureRecognizer> = new Set();
    private activePointers: Map<number, PointerEvent> = new Map();
    private winner: GestureRecognizer | null = null;
    private captureTarget: HTMLElement | null = null;
    private capturedPointerId: number | null = null;

    addRecognizer(recognizer: GestureRecognizer) {
        this.recognizers.add(recognizer);
        return this;
    }

    handleEvent(event: PointerEvent, captureTarget?: HTMLElement) {
        if (event.type === 'pointerdown') {
            this.activePointers.set(event.pointerId, event);
        } else if (event.type === 'pointermove') {
            this.activePointers.set(event.pointerId, event);
        } else if (event.type === 'pointerup' || event.type === 'pointercancel') {
            this.activePointers.set(event.pointerId, event);
        }

        const allPointers = Array.from(this.activePointers.values());

        if (this.winner) {
            this.winner.process(event, allPointers);
            if (this.winner.state > 2) this.reset();
            if (event.type === 'pointerup' || event.type === 'pointercancel') {
                this.activePointers.delete(event.pointerId);
            }
            return;
        }

        for (const recognizer of this.recognizers) {
            recognizer.process(event, allPointers);
            if (recognizer.state === GestureState.BEGAN) {
                this.declareWinner(recognizer, captureTarget ?? null, event.pointerId);
                break;
            }
        }

        if (event.type === 'pointerup' || event.type === 'pointercancel') {
            this.activePointers.delete(event.pointerId);
        }
    }

    private declareWinner(winner: GestureRecognizer, captureTarget: HTMLElement | null, pointerId: number) {
        this.winner = winner;
        this.captureTarget = captureTarget;
        this.capturedPointerId = pointerId;
        if (this.captureTarget) {
            try { this.captureTarget.setPointerCapture(pointerId); } catch (e) { }
        }
        this.recognizers.forEach(r => { if (r !== this.winner) r.reset(); });
    }

    private reset() {
        if (this.captureTarget && this.capturedPointerId !== null) {
            try { this.captureTarget.releasePointerCapture(this.capturedPointerId); } catch (e) { }
        }
        this.captureTarget = null;
        this.capturedPointerId = null;
        this.winner = null;
        this.recognizers.forEach(r => r.reset());
    }
}

export class TapSliderRecognizer extends GestureRecognizer {
    private startX = 0;
    private startY = 0;
    private moved = false;
    private sliderAxisLockThreshold = 14;
    private verticalCancelThreshold = 10;

    // Updated constructor to include onLongPress in the type definition
    constructor(private callbacks: {
        onTap?: () => void;
        onLongPress?: () => void; // Added this line
        onSliderStart?: () => void;
        onSliderUpdate?: (dx: number) => void;
        onSliderEnd?: () => void;
        onSliderCancel?: () => void;
    }) { super(); }

    process(event: PointerEvent, allPointers: PointerEvent[]) {
        if (event.type === 'pointercancel') {
            if (this.state === GestureState.BEGAN) {
                this.callbacks.onSliderCancel?.();
            }
            this.state = GestureState.CANCELLED;
            return;
        }

        if (allPointers.length !== 1) return;

        if (event.type === 'pointerdown') {
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.moved = false;
            this.state = GestureState.POSSIBLE;

            // Optional: You could implement timer-based long press logic here 
            // if you wanted the engine to handle the timing itself.

        } else if (event.type === 'pointermove') {
            const dx = event.clientX - this.startX;
            const dy = event.clientY - this.startY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (this.state === GestureState.POSSIBLE) {
                this.moved = absDx > this.touchSlop || absDy > this.touchSlop;
            }

            if (this.state === GestureState.POSSIBLE && absDy > this.verticalCancelThreshold && absDy > absDx) {
                this.state = GestureState.FAILED;
            } else if (
                this.state === GestureState.POSSIBLE &&
                absDx > this.sliderAxisLockThreshold &&
                absDx > absDy + 6
            ) {
                this.state = GestureState.BEGAN;
                this.callbacks.onSliderStart?.();
            } else if (this.state === GestureState.BEGAN) {
                this.callbacks.onSliderUpdate?.(dx);
            }
        } else if (event.type === 'pointerup') {
            if (this.state === GestureState.POSSIBLE && !this.moved) {
                this.callbacks.onTap?.();
            } else if (this.state === GestureState.BEGAN) {
                this.callbacks.onSliderEnd?.();
            }
            this.state = GestureState.ENDED;
        }
    }

    reset() {
        super.reset();
        this.moved = false;
    }
}
