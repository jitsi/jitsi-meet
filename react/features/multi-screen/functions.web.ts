import { IReduxState, IStore } from '../app/types';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media/constants';
import { getTrackByMediaTypeAndParticipant, getVideoTrackByParticipant } from '../base/tracks/functions.any';
import { getLargeVideoParticipant } from '../large-video/functions';

import { removeSecondScreen } from './actions.web';
import { DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH } from './constants';
import logger from './logger';
import { ISecondScreenSource } from './types';

/**
 * Minimal typings for the Window Management API, not yet in the TS DOM lib.
 * Declared in this web-only module so the native build never sees it.
 */
interface IScreenDetailed {
    availHeight: number;
    availLeft: number;
    availTop: number;
    availWidth: number;
    left: number;
    top: number;
}
interface IScreenDetails {
    currentScreen: IScreenDetailed;
    screens: IScreenDetailed[];
}
declare global {

    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        getScreenDetails?: () => Promise<IScreenDetails>;
    }
}

/**
 * A second-screen window, constructed via {@code window.open} in the same
 * origin/process as the meeting so its {@code <video>} can render the meeting's
 * tracks by reference.
 */
type ISecondScreenWindow = Window & { MediaStream: typeof MediaStream; };

interface IWindowEntry {
    clone?: MediaStreamTrack;
    screenId?: number;
    source: ISecondScreenSource;
    video: HTMLVideoElement;
    win: Window;
}

/**
 * The live second-screen windows, keyed by id. Module scope because the windows
 * outlive any single React render and the middleware reconciles them.
 */
const windows = new Map<string, IWindowEntry>();

/**
 * Whether second-screen windows can be opened in this environment.
 *
 * @returns {boolean}
 */
export function isSecondScreenSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.open === 'function';
}

/**
 * Whether the multi-screen feature is enabled (config flag + support). The
 * Window Management API and AutomaticFullscreen permission (Chromium, managed
 * kiosk) are used opportunistically and degrade gracefully when absent.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isSecondScreenEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].secondScreen?.enabled) && isSecondScreenSupported();
}

/**
 * Resolves a source descriptor to a native {@code MediaStreamTrack} and the
 * participant currently backing it.
 *
 * @param {IReduxState} state - The redux state.
 * @param {ISecondScreenSource} source - The source descriptor.
 * @returns {Object} The resolved native track and backing participant id.
 */
function resolveSource(state: IReduxState, source: ISecondScreenSource) {
    const tracks = state['features/base/tracks'];
    let iTrack;
    let participantId: string | undefined;

    if (source.role === 'stage') {
        const participant = getLargeVideoParticipant(state);

        participantId = participant?.id;
        iTrack = getVideoTrackByParticipant(state, participant);
    } else if (source.role === 'screenshare') {
        iTrack = tracks.find(t => t.videoType === VIDEO_TYPE.DESKTOP && !t.muted && Boolean(t.jitsiTrack));
        participantId = iTrack?.participantId;
    } else if (source.participant) {
        participantId = source.participant;
        const mediaType = source.media === 'desktop' ? MEDIA_TYPE.SCREENSHARE : MEDIA_TYPE.VIDEO;

        iTrack = getTrackByMediaTypeAndParticipant(tracks, mediaType, source.participant);
    }

    return {
        track: (iTrack?.jitsiTrack?.getTrack?.() as MediaStreamTrack) ?? null,
        participantId: participantId ?? null
    };
}

/**
 * A stable signature of what every second-screen window should currently render
 * (its resolved track id). When it changes — e.g. the active speaker switches —
 * the subscriber re-applies the sources, swapping {@code srcObject} in place.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
export function getSecondScreenSignature(state: IReduxState): string {
    const { screens } = state['features/multi-screen'];

    return Object.keys(screens).sort()
        .map(id => {
            const { track } = resolveSource(state, screens[id].source);

            return `${id}:${track ? track.id : 'none'}`;
        })
        .join('|');
}

/**
 * Computes the {@code window.open} features string, placing the window on a
 * physical screen via the Window Management API when available.
 *
 * @param {number} screenId - Optional target screen index.
 * @returns {Promise<string>}
 */
async function computeFeatures(screenId?: number): Promise<string> {
    const fallback = `popup,width=${DEFAULT_WINDOW_WIDTH},height=${DEFAULT_WINDOW_HEIGHT}`;

    if (typeof window.getScreenDetails !== 'function') {
        return fallback;
    }

    try {
        const details = await window.getScreenDetails();
        const screen = typeof screenId === 'number' && details.screens[screenId]
            ? details.screens[screenId]
            : details.screens.find(s => s.left !== details.currentScreen.left || s.top !== details.currentScreen.top);

        if (screen) {
            return `popup,left=${screen.availLeft},top=${screen.availTop},width=${screen.availWidth},height=${screen.availHeight}`;
        }
    } catch (e) {
        logger.warn('getScreenDetails failed; opening an unplaced window', e);
    }

    return fallback;
}

/**
 * Builds the (empty) second-screen document: a full-bleed video on black. Uses
 * element styles (not a stylesheet/inline script) to stay CSP-safe.
 *
 * @param {Window} win - The opened window.
 * @returns {HTMLVideoElement}
 */
function buildWindow(win: Window): HTMLVideoElement {
    const doc = win.document;

    doc.title = 'Jitsi Meet';
    Object.assign(doc.documentElement.style, { height: '100%' });
    Object.assign(doc.body.style, { margin: '0', height: '100%', background: '#000', overflow: 'hidden' });

    const video = doc.createElement('video');

    video.autoplay = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    Object.assign(video.style, {
        position: 'fixed', inset: '0', width: '100%', height: '100%', objectFit: 'contain', background: '#000'
    });
    doc.body.appendChild(video);

    return video;
}

/**
 * Renders a track into a window's video by reference (cloning so the meeting
 * keeps its own copy), stopping any previously rendered clone.
 *
 * @param {IWindowEntry} entry - The window entry.
 * @param {MediaStreamTrack | null} track - The track to render.
 * @returns {void}
 */
function renderTrack(entry: IWindowEntry, track: MediaStreamTrack | null) {
    if (entry.clone) {
        try {
            entry.clone.stop();
        } catch (e) { /* ignore */ }
        entry.clone = undefined;
    }
    if (!track) {
        entry.video.srcObject = null;

        return;
    }
    const clone = track.clone();

    entry.clone = clone;
    entry.video.srcObject = new (entry.win as ISecondScreenWindow).MediaStream([ clone ]);
}

/**
 * Notifies the iframe embedder that a window's resolved source changed.
 *
 * @param {string} id - The window id.
 * @param {ISecondScreenSource} source - The window's source descriptor.
 * @param {string | null} participantId - The participant currently backing it.
 * @returns {void}
 */
function notifySourceChanged(id: string, source: ISecondScreenSource, participantId: string | null) {
    APP.API?.notifySecondScreenSourceChanged?.({ id, source, participantId });
}

/**
 * Resolves and renders the current track for a window, and notifies the embedder.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @returns {void}
 */
function applySource(store: IStore, id: string) {
    const entry = windows.get(id);

    if (!entry || entry.win.closed) {
        return;
    }
    const { track, participantId } = resolveSource(store.getState(), entry.source);

    renderTrack(entry, track);
    notifySourceChanged(id, entry.source, participantId);
}

/**
 * Cleans up an entry's resources without dispatching (used by both explicit
 * close and the window being closed externally).
 *
 * @param {string} id - The window id.
 * @param {boolean} closeWindow - Whether to also close the OS window.
 * @returns {void}
 */
function teardown(id: string, closeWindow: boolean) {
    const entry = windows.get(id);

    if (!entry) {
        return;
    }
    if (entry.clone) {
        try {
            entry.clone.stop();
        } catch (e) { /* ignore */ }
    }
    windows.delete(id);
    if (closeWindow) {
        try {
            !entry.win.closed && entry.win.close();
        } catch (e) { /* ignore */ }
    }
}

/**
 * Handles the user closing a second-screen window directly: clean up and reflect
 * it in state.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @returns {void}
 */
function handleWindowClosed(store: IStore, id: string) {
    if (!windows.has(id)) {
        return;
    }
    teardown(id, false);
    APP.API?.notifySecondScreenClosed?.({ id });
    store.dispatch(removeSecondScreen(id));
}

/**
 * Opens a new second-screen window (or updates an existing one) and renders the
 * given source. Best-effort placement + fullscreen; both require the Window
 * Management / AutomaticFullscreen permissions on a managed/kiosk device.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {ISecondScreenSource} source - What to render.
 * @param {number} screenId - Optional target screen index.
 * @returns {Promise<void>}
 */
export async function openOrUpdateSecondScreen(
        store: IStore, id: string, source: ISecondScreenSource, screenId?: number): Promise<void> {
    if (!isSecondScreenEnabled(store.getState())) {
        APP.API?.notifySecondScreenError?.({ id, error: 'second-screen-disabled' });

        return;
    }

    const existing = windows.get(id);

    if (existing && !existing.win.closed) {
        existing.source = source;
        existing.screenId = screenId;
        applySource(store, id);

        return;
    }

    const features = await computeFeatures(screenId);
    const win = window.open('', `jitsiSecondScreen_${id}`, features);

    if (!win) {
        logger.warn(`Failed to open second-screen window "${id}" (popup blocked?)`);
        APP.API?.notifySecondScreenError?.({ id, error: 'popup-blocked' });
        store.dispatch(removeSecondScreen(id));

        return;
    }

    const entry: IWindowEntry = { win, source, screenId, video: buildWindow(win) };

    windows.set(id, entry);
    win.addEventListener('pagehide', () => handleWindowClosed(store, id), { once: true });

    try {
        await win.document.documentElement.requestFullscreen();
    } catch (e) {
        logger.debug(`Auto-fullscreen not granted for second screen "${id}"`, e);
    }

    applySource(store, id);
}

/**
 * Closes a single second-screen window.
 *
 * @param {string} id - The window id.
 * @returns {void}
 */
export function closeSecondScreen(id: string) {
    if (!windows.has(id)) {
        return;
    }
    teardown(id, true);
    APP.API?.notifySecondScreenClosed?.({ id });
}

/**
 * Closes every second-screen window.
 *
 * @returns {void}
 */
export function closeAllSecondScreens() {
    Array.from(windows.keys()).forEach(closeSecondScreen);
}

/**
 * Re-resolves and re-renders every open second-screen window. Called by the
 * subscriber when the active speaker / tracks change.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
export function refreshSecondScreens(store: IStore) {
    Array.from(windows.keys()).forEach(id => {
        const entry = windows.get(id);

        if (entry?.win.closed) {
            handleWindowClosed(store, id);
        } else {
            applySource(store, id);
        }
    });
}
