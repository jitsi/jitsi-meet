/**
 * WebAudio-based sound manager with HTMLAudio fallback.
 *
 * This module replaces the many-<audio> approach with a WebAudio-first system
 * that uses a shared AudioContext and buffer caching. Falls back to a pool of
 * 3 HTMLAudioElements when WebAudio is unavailable or encounters errors.
 *
 * Preserves the existing playSound/stopSound API for backward compatibility.
 */

import logger from './logger';

/**
 * Options for playing a sound.
 */
interface IPlaySoundOptions {
    loop?: boolean;
    volume?: number;
}

/**
 * Internal state for active playback (WebAudio or HTMLAudio).
 */
interface IPlaybackEntry {
    audioElement?: HTMLAudioElement;
    gainNode?: GainNode;
    handle: string;
    loop: boolean;
    node?: AudioBufferSourceNode;
    soundId: string;
}

/**
 * Shared AudioContext instance (lazy-initialized).
 */
let audioContext: AudioContext | null = null;

/**
 * Cache of decoded audio buffers, keyed by sound URL.
 */
const bufferCache = new Map<string, AudioBuffer>();

/**
 * Map of currently playing sounds, keyed by handle.
 */
const playingMap = new Map<string, IPlaybackEntry>();

/**
 * Counter for generating unique handles.
 */
let handleCounter = 0;

/**
 * Pool of reusable HTMLAudioElements for fallback playback.
 */
const htmlAudioPool: HTMLAudioElement[] = [];

/**
 * Maximum size of the HTMLAudio fallback pool.
 */
const HTML_AUDIO_POOL_SIZE = 3;

/**
 * Round-robin index for pool reuse.
 */
let poolIndex = 0;

/**
 * Registry mapping sound IDs to their URLs.
 * Populated from the reducer state via registerSoundUrl().
 */
const soundUrlRegistry = new Map<string, string>();

/**
 * Current audio output device ID (for setSinkId).
 */
let currentOutputDeviceId: string | undefined;

/**
 * Creates or retrieves the shared AudioContext.
 * Returns null if AudioContext is not supported.
 *
 * @returns {AudioContext | null} The shared AudioContext instance or null if unsupported.
 */
function createAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (audioContext) {
        return audioContext;
    }

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        audioContext = new AudioContextClass();

        return audioContext;
    } catch (error) {
        logger.warn('Failed to create AudioContext', error);

        return null;
    }
}

/**
 * Attempts to resume the AudioContext if it's in a suspended state.
 * Should be called on user gesture for best results.
 *
 * @returns {Promise<void>} Resolves when resume completes (or no-op if unavailable).
 */
async function ensureAudioContextResumed(): Promise<void> {
    const ctx = createAudioContext();

    if (ctx && ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch (error) {
            logger.warn('Failed to resume AudioContext', error);
        }
    }
}

/**
 * Registers a sound ID with its URL for later playback.
 * This should be called when sounds are registered in the Redux store.
 *
 * @param {string} soundId - The identifier of the sound.
 * @param {string} url - The URL for the sound resource.
 * @returns {void}
 */
export function registerSoundUrl(soundId: string, url: string): void {
    soundUrlRegistry.set(soundId, url);
}

/**
 * Unregisters a sound ID.
 *
 * @param {string} soundId - The identifier of the sound to remove.
 * @returns {void}
 */
export function unregisterSoundUrl(soundId: string): void {
    soundUrlRegistry.delete(soundId);
}

/**
 * Sets the current audio output device ID.
 * This will be applied to all HTMLAudio elements in the pool.
 *
 * @param {string} deviceId - The audio output device identifier.
 * @returns {void}
 */
export function setAudioOutputDevice(deviceId: string): void {
    currentOutputDeviceId = deviceId;

    // Apply to existing pool elements
    if (typeof window !== 'undefined') {
        for (const audio of htmlAudioPool) {
            if (audio && typeof (audio as any).setSinkId === 'function') {
                (audio as any).setSinkId(deviceId).catch((error: Error) => {
                    logger.warn(`Failed to set sink ID on audio pool element: ${error}`);
                });
            }
        }
    }
}

/**
 * Loads and decodes an audio buffer from a URL.
 * Returns cached buffer if already loaded.
 *
 * @param {string} url - The sound URL to load and decode.
 * @returns {Promise<AudioBuffer | null>} The decoded buffer or null on failure.
 */
async function loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    // Check cache first
    const cached = bufferCache.get(url);

    if (cached) {
        return cached;
    }

    const ctx = createAudioContext();

    if (!ctx) {
        return null;
    }

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        bufferCache.set(url, audioBuffer);

        return audioBuffer;
    } catch (error) {
        logger.warn(`Failed to load audio buffer for ${url}`, error);

        return null;
    }
}

/**
 * Creates and plays a sound using WebAudio API.
 * Returns a handle for later control, or null on failure.
 *
 * @param {string} soundId - The identifier of the sound to play.
 * @param {string} url - The URL of the sound resource.
 * @param {IPlaySoundOptions} options - Playback options (loop, volume).
 * @returns {Promise<string | null>} Playback handle or null on failure.
 */
async function playWithWebAudio(
        soundId: string,
        url: string,
        options: IPlaySoundOptions = {}
): Promise<string | null> {
    const ctx = createAudioContext();

    if (!ctx) {
        return null;
    }

    await ensureAudioContextResumed();

    const buffer = await loadAudioBuffer(url);

    if (!buffer) {
        return null;
    }

    const handle = `webaudio-${++handleCounter}`;
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    source.loop = options.loop ?? false;
    gainNode.gain.value = options.volume ?? 1.0;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Store playback entry
    const entry: IPlaybackEntry = {
        soundId,
        handle,
        node: source,
        gainNode,
        loop: source.loop
    };

    playingMap.set(handle, entry);

    // Clean up when sound ends (if not looping)
    source.onended = () => {
        playingMap.delete(handle);
    };

    try {
        source.start(0);

        return handle;
    } catch (error) {
        logger.warn('Failed to start WebAudio source', error);
        playingMap.delete(handle);

        return null;
    }
}

/**
 * Gets or creates an HTMLAudioElement from the pool.
 *
 * @returns {HTMLAudioElement} A pooled HTMLAudioElement ready for playback.
 */
function getAudioElementFromPool(): HTMLAudioElement {
    if (typeof window === 'undefined') {
        throw new Error('HTMLAudioElement not available in non-browser environment');
    }

    // Initialize pool if empty
    if (htmlAudioPool.length < HTML_AUDIO_POOL_SIZE) {
        const audio = document.createElement('audio');

        audio.style.display = 'none';
        document.body.appendChild(audio);

        // Apply current output device if set
        if (currentOutputDeviceId && typeof (audio as any).setSinkId === 'function') {
            (audio as any).setSinkId(currentOutputDeviceId).catch((error: Error) => {
                logger.warn(`Failed to set sink ID on new audio element: ${error}`);
            });
        }

        htmlAudioPool.push(audio);

        return audio;
    }

    // Round-robin selection
    poolIndex = (poolIndex + 1) % htmlAudioPool.length;

    return htmlAudioPool[poolIndex];
}

/**
 * Plays a sound using HTMLAudio fallback.
 * Returns a handle for later control.
 *
 * @param {string} soundId - The identifier of the sound to play.
 * @param {string} url - The URL of the sound resource.
 * @param {IPlaySoundOptions} options - Playback options (loop, volume).
 * @returns {string} Playback handle for this HTMLAudio instance.
 */
function playWithHtmlAudio(
        soundId: string,
        url: string,
        options: IPlaySoundOptions = {}
): string {
    const audio = getAudioElementFromPool();
    const handle = `htmlaudio-${++handleCounter}`;

    // Stop any current playback on this element
    audio.pause();
    audio.currentTime = 0;

    // Configure and play
    audio.src = url;
    audio.loop = options.loop ?? false;
    audio.volume = options.volume ?? 1.0;

    const entry: IPlaybackEntry = {
        soundId,
        handle,
        audioElement: audio,
        loop: audio.loop
    };

    playingMap.set(handle, entry);

    // Clean up when sound ends (if not looping)
    const onEnded = () => {
        playingMap.delete(handle);
        audio.removeEventListener('ended', onEnded);
    };

    audio.addEventListener('ended', onEnded);

    audio.play().catch(error => {
        logger.warn('Failed to play HTMLAudio element', error);
        playingMap.delete(handle);
    });

    return handle;
}

/**
 * Plays a sound by ID.
 * Attempts WebAudio first, falls back to HTMLAudio pool on any error.
 *
 * @param {string} soundId - The sound identifier (must be registered via registerSoundUrl).
 * @param {IPlaySoundOptions} options - Playback options (loop, volume).
 * @returns {Promise<string>} A unique handle for controlling this playback instance.
 */
export async function playSound(
        soundId: string,
        options: IPlaySoundOptions = {}
): Promise<string> {
    const url = soundUrlRegistry.get(soundId);

    if (!url) {
        logger.warn(`playSound: no URL registered for soundId: ${soundId}`);

        // Return a dummy handle
        return `error-${++handleCounter}`;
    }

    try {
        // Attempt WebAudio first
        const handle = await playWithWebAudio(soundId, url, options);

        if (handle) {
            return handle;
        }
    } catch (error) {
        logger.warn('WebAudio playback failed, falling back to HTMLAudio', error);
    }

    // Fallback to HTMLAudio
    return playWithHtmlAudio(soundId, url, options);
}

/**
 * Stops a sound by handle or sound ID.
 * If a handle is provided, stops only that specific playback instance.
 * If a soundId is provided, stops all instances of that sound.
 *
 * @param {string} handleOrSoundId - Either a playback handle or a sound ID.
 * @returns {void}
 */
export function stopSound(handleOrSoundId: string): void {
    // Try as handle first
    const entry = playingMap.get(handleOrSoundId);

    if (entry) {
        _stopEntry(entry);
        playingMap.delete(handleOrSoundId);

        return;
    }

    // Try as soundId - stop all matching instances
    const toStop: string[] = [];

    for (const [ handle, playbackEntry ] of playingMap.entries()) {
        if (playbackEntry.soundId === handleOrSoundId) {
            toStop.push(handle);
        }
    }

    for (const handle of toStop) {
        const playbackEntry = playingMap.get(handle);

        if (playbackEntry) {
            _stopEntry(playbackEntry);
            playingMap.delete(handle);
        }
    }
}

/**
 * Internal helper to stop a playback entry.
 *
 * @param {IPlaybackEntry} entry - The playback entry to stop.
 * @returns {void}
 */
function _stopEntry(entry: IPlaybackEntry): void {
    if (entry.node) {
        try {
            entry.node.stop();
        } catch (error) {
            // Ignore - node may already be stopped
        }
        if (entry.gainNode) {
            entry.gainNode.disconnect();
        }
    }

    if (entry.audioElement) {
        entry.audioElement.pause();
        entry.audioElement.currentTime = 0;
    }
}

/**
 * Returns the number of audio elements currently in the DOM.
 * Useful for manual verification that we're not creating many elements.
 *
 * @returns {number} Count of audio elements in the document.
 */
export function getAudioElementCount(): number {
    if (typeof document === 'undefined') {
        return 0;
    }

    return document.querySelectorAll('audio').length;
}

/**
 * Initializes the sound manager (optional).
 * Can be called on app startup to pre-create the AudioContext.
 *
 * @returns {void}
 */
export function init(): void {
    createAudioContext();
}
