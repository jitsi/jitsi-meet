/*
 * A minimal sound manager for Web that avoids creating one <audio> element
 * per registered sound. It uses a small pool for one-shot sounds and
 * on-demand elements for looping sounds.
 */

type OptionalHTMLAudioElement = HTMLAudioElement | undefined | null;

class SoundManager {
    private static instance: SoundManager | undefined;

    // Small pool to allow limited overlap of short notification sounds
    private oneShotPool: Array<OptionalHTMLAudioElement> = [];
    private poolSize: number = 3;
    private nextPoolIndex: number = 0;

    // Looping sounds tracked by sound id
    private loopElementsById: Map<string, HTMLAudioElement> = new Map();

    private currentSinkId: string | undefined;

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    play(soundId: string, src: string, loop: boolean): void {
        if (loop) {
            this.playLoop(soundId, src);
            return;
        }
        this.playOneShot(src);
    }

    stop(soundId: string): void {
        const el = this.loopElementsById.get(soundId);
        if (el) {
            try {
                el.pause();
                el.currentTime = 0;
            } catch {
                // ignore
            }
            this.loopElementsById.delete(soundId);
        }
    }

    setSinkId(deviceId: string): void {
        this.currentSinkId = deviceId;

        // Update all managed elements where supported
        for (const el of this.oneShotPool) {
            this.applySinkId(el);
        }

        for (const el of this.loopElementsById.values()) {
            this.applySinkId(el);
        }
    }

    private playOneShot(src: string): void {
        const el = this.getOrCreateOneShotElement();
        if (!el) {
            return;
        }

        try {
            // Reset and set new source
            el.loop = false;
            el.src = src;
            // Some browsers require calling load() after changing src for quick reuse
            // but it is usually optional. Call to be safe and consistent.
            el.load();
            void el.play().catch(() => { /* ignore play rejections */ });
        } catch {
            // ignore
        }
    }

    private playLoop(soundId: string, src: string): void {
        let el = this.loopElementsById.get(soundId);
        if (!el) {
            el = this.createAudioElement();
            if (!el) {
                return;
            }
            el.loop = true;
            this.loopElementsById.set(soundId, el);
        }

        try {
            el.src = src;
            el.load();
            void el.play().catch(() => { /* ignore play rejections */ });
        } catch {
            // ignore
        }
    }

    private getOrCreateOneShotElement(): OptionalHTMLAudioElement {
        if (this.oneShotPool.length < this.poolSize) {
            const el = this.createAudioElement();
            if (!el) {
                return null;
            }
            this.oneShotPool.push(el);
            return el;
        }

        const el = this.oneShotPool[this.nextPoolIndex];
        this.nextPoolIndex = (this.nextPoolIndex + 1) % this.oneShotPool.length;

        try {
            // Interrupt any current playback for the chosen element
            el?.pause();
            if (el) {
                el.currentTime = 0;
            }
        } catch {
            // ignore
        }

        return el;
    }

    private createAudioElement(): OptionalHTMLAudioElement {
        try {
            const el = new Audio();
            // Minimize background work when idle
            el.preload = 'none';
            el.autoplay = false;
            // Ensure it is not visible and not attached to DOM; playback works fine off-DOM
            this.applySinkId(el);
            return el;
        } catch {
            return null;
        }
    }

    private applySinkId(el?: HTMLAudioElement | null): void {
        if (!el || !this.currentSinkId) {
            return;
        }
        // @ts-ignore - setSinkId is not in the standard DOM typings everywhere
        if (typeof el.setSinkId === 'function') {
            // @ts-ignore
            el.setSinkId(this.currentSinkId).catch(() => { /* ignore */ });
        }
    }
}

export default SoundManager.getInstance();


