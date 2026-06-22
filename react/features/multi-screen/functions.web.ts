import { IReduxState, IStore } from '../app/types';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media/constants';
import { getParticipantById, getParticipantDisplayName } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { getTrackByMediaTypeAndParticipant, getVideoTrackByParticipant } from '../base/tracks/functions.any';
import { getLargeVideoParticipant } from '../large-video/functions';
import { renderAvatarOnCanvas } from '../pip/functions';

import { removeSecondScreen } from './actions.web';
import logger from './logger';
import { ISecondScreenSource } from './types';

// The Window Management API typings (Window.getScreenDetails, ScreenDetails, ScreenDetailed) come
// from the `@types/webscreens-window-placement` devDependency.

/**
 * A second-screen window, constructed via {@code window.open} in the same
 * origin/process as the meeting so its {@code <video>} can render the meeting's
 * tracks by reference.
 */
type ISecondScreenWindow = Window & { MediaStream: typeof MediaStream; };

/**
 * A canvas {@code captureStream} track exposes a non-standard {@code requestFrame}
 * used to push a single frame on demand.
 */
type IFrameRequestingTrack = MediaStreamTrack & { requestFrame?: () => void; };

/**
 * The live handles backing a single second-screen window. Only the
 * non-serializable DOM/media objects live here; the window's source/screen
 * configuration is held in redux ({@code features/multi-screen}), which is the
 * single source of truth.
 */
interface IWindowEntry {

    /**
     * The off-screen canvas used to render a participant's avatar when their
     * video is unavailable (created lazily, reused across redraws).
     */
    avatarCanvas?: HTMLCanvasElement;

    /**
     * The second window's {@code MediaStream} wrapping the avatar canvas track
     * (what {@code video.srcObject} points at while the avatar is shown).
     */
    avatarSrc?: MediaStream;

    /**
     * The avatar canvas {@code captureStream} track (kept to push frames and to
     * stop it on teardown).
     */
    avatarTrack?: IFrameRequestingTrack;

    /**
     * The clone of the currently rendered meeting track (the meeting keeps its
     * own copy; the clone is stopped when swapped out or on teardown).
     */
    clone?: MediaStreamTrack;

    /**
     * The {@code <video>} in the second window.
     */
    video: HTMLVideoElement;

    /**
     * The second-screen window itself.
     */
    win: Window;
}

/**
 * The live second-screen windows, keyed by id. Module scope because the windows
 * (and their {@code Window}/{@code <video>}/cloned-track objects) are not
 * serializable and outlive any single React render; redux holds the serializable
 * configuration and the middleware reconciles the two.
 */
const windows = new Map<string, IWindowEntry>();

/**
 * The avatar canvas is rendered at a modest 4:3 size and scaled up by the
 * full-bleed {@code <video>} (object-fit: contain) on the second screen.
 */
const AVATAR_CANVAS_WIDTH = 640;
const AVATAR_CANVAS_HEIGHT = 480;

/**
 * Avatar colours, matched to the black second-screen window background.
 */
const AVATAR_BACKGROUND = '#000';
const AVATAR_TEXT_COLOR = '#fff';
const AVATAR_FONT_FAMILY = 'Inter, sans-serif';

/**
 * Whether second-screen windows can be opened in this environment. The feature
 * requires the Window Management API (Chromium) so it can enumerate displays and
 * place the window on a second screen; without it we have no control over the
 * second screen, so we do not support the feature.
 *
 * @returns {boolean}
 */
export function isSecondScreenSupported(): boolean {
    return typeof window !== 'undefined' && 'getScreenDetails' in window;
}

/**
 * Whether the multi-screen feature is enabled (config flag + support).
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isSecondScreenEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].secondScreen?.enabled) && isSecondScreenSupported();
}

/**
 * Resolves a source descriptor to a native {@code MediaStreamTrack} (when the
 * backing participant has live, unmuted video) and the participant backing it.
 * When there is no usable video track, {@code track} is {@code null} and the
 * caller falls back to rendering the participant's avatar.
 *
 * @param {IReduxState} state - The redux state.
 * @param {ISecondScreenSource} source - The source descriptor.
 * @returns {Object} The resolved native track (or {@code null}) and backing participant.
 */
function resolveSource(state: IReduxState, source: ISecondScreenSource) {
    const tracks = state['features/base/tracks'];
    let iTrack;
    let participant: IParticipant | undefined;

    if (source.role === 'stage') {
        participant = getLargeVideoParticipant(state);
        iTrack = getVideoTrackByParticipant(state, participant);
    } else if (source.role === 'screenshare') {
        iTrack = tracks.find(t => t.videoType === VIDEO_TYPE.DESKTOP && !t.muted && Boolean(t.jitsiTrack));
        participant = iTrack ? getParticipantById(state, iTrack.participantId) : undefined;
    } else if (source.participant) {
        participant = getParticipantById(state, source.participant);
        const mediaType = source.media === 'desktop' ? MEDIA_TYPE.SCREENSHARE : MEDIA_TYPE.VIDEO;

        iTrack = getTrackByMediaTypeAndParticipant(tracks, mediaType, source.participant);
    }

    const track = iTrack && !iTrack.muted
        ? (iTrack.jitsiTrack?.getTrack?.() as MediaStreamTrack) ?? null
        : null;

    return {
        participant,
        track
    };
}

/**
 * A stable signature of what every second-screen window should currently render.
 * When it changes — the active speaker switches, a source mutes/unmutes, or an
 * avatar finishes loading — the subscriber re-applies the sources, swapping the
 * window content in place. Includes the avatar identity (id/url/name) so the
 * fallback avatar redraws even while no track is present.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
export function getSecondScreenSignature(state: IReduxState): string {
    const { screens } = state['features/multi-screen'];

    return Object.keys(screens).sort()
        .map(id => {
            const { track, participant } = resolveSource(state, screens[id].source);
            const key = track
                ? track.id
                : `avatar:${participant?.id ?? ''}:${participant?.loadableAvatarUrl ?? ''}:${participant?.name ?? ''}`;

            return `${id}:${key}`;
        })
        .join('|');
}

/**
 * Computes the {@code window.open} features string, placing the window on a
 * physical screen via the Window Management API. Rejects if the API is
 * unavailable/denied (the feature requires it).
 *
 * @param {number} screenId - Optional target screen index.
 * @returns {Promise<string>}
 */
async function computeFeatures(screenId?: number): Promise<string> {
    const details = await window.getScreenDetails();
    const target = (typeof screenId === 'number' && details.screens[screenId])
        || details.screens.find(s => s.left !== details.currentScreen.left || s.top !== details.currentScreen.top)
        || details.currentScreen;

    // No avail* offsets: the window is auto-fullscreened, so the full screen bounds are what matter.
    return `popup,left=${target.left},top=${target.top},width=${target.width},height=${target.height}`;
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
 * Renders a meeting track into a window's video by reference (cloning so the
 * meeting keeps its own copy), stopping any previously rendered clone.
 *
 * @param {IWindowEntry} entry - The window entry.
 * @param {MediaStreamTrack} track - The track to render.
 * @returns {void}
 */
function renderTrack(entry: IWindowEntry, track: MediaStreamTrack) {
    if (entry.clone) {
        entry.clone.stop();
        entry.clone = undefined;
    }
    const clone = track.clone();

    entry.clone = clone;
    entry.video.srcObject = new (entry.win as ISecondScreenWindow).MediaStream([ clone ]);
}

/**
 * Renders a participant's avatar (image, initials, or default) into a window's
 * video as a fallback when there is no usable video track (e.g. the source muted
 * their camera). Reuses the PiP feature's canvas-avatar rendering and feeds it to
 * the window by reference, mirroring {@link renderTrack}.
 *
 * @param {IReduxState} state - The redux state.
 * @param {IWindowEntry} entry - The window entry.
 * @param {IParticipant | undefined} participant - The participant whose avatar to render.
 * @returns {void}
 */
function renderAvatar(state: IReduxState, entry: IWindowEntry, participant: IParticipant | undefined) {
    if (entry.clone) {
        entry.clone.stop();
        entry.clone = undefined;
    }

    let canvas = entry.avatarCanvas;

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = AVATAR_CANVAS_WIDTH;
        canvas.height = AVATAR_CANVAS_HEIGHT;

        // captureStream(0): on-demand; we push a frame via requestFrame() after each draw.
        const track = canvas.captureStream(0).getVideoTracks()[0] as IFrameRequestingTrack;

        entry.avatarCanvas = canvas;
        entry.avatarTrack = track;

        // The track is created in this (meeting) document; wrap it in the second window's
        // MediaStream so its <video> renders it by reference (same trick as renderTrack()).
        entry.avatarSrc = new (entry.win as ISecondScreenWindow).MediaStream([ track ]);
    }

    if (entry.video.srcObject !== entry.avatarSrc) {
        entry.video.srcObject = entry.avatarSrc ?? null;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    const displayName = participant?.id ? getParticipantDisplayName(state, participant.id) : '';
    const customAvatarBackgrounds = state['features/dynamic-branding']?.avatarBackgrounds ?? [];

    // Reuses the PiP feature's canvas-avatar rendering (image → initials → default icon).
    renderAvatarOnCanvas(
        canvas, ctx, participant, displayName, customAvatarBackgrounds,
        null, AVATAR_BACKGROUND, AVATAR_FONT_FAMILY, AVATAR_TEXT_COLOR, AVATAR_TEXT_COLOR)
        .then(() => entry.avatarTrack?.requestFrame?.())
        .catch(e => logger.warn('Failed to render second-screen avatar', e));
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
 * Resolves and renders the current source for a window, and notifies the
 * embedder. Reads the window's configured source from redux (the single source
 * of truth). Falls back to the participant's avatar when there is no live video.
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
    const state = store.getState();
    const config = state['features/multi-screen'].screens[id];

    if (!config) {
        return;
    }
    const { track, participant } = resolveSource(state, config.source);

    if (track) {
        renderTrack(entry, track);
    } else {
        renderAvatar(state, entry, participant);
    }
    notifySourceChanged(id, config.source, participant?.id ?? null);
}

/**
 * Cleans up an entry's resources without dispatching (used by both explicit
 * close and the window being closed externally). The map entry is dropped before
 * the window is closed, so no reference to a closed window is retained.
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

    // MediaStreamTrack.stop() is infallible per spec, so no try/catch.
    entry.clone?.stop();
    entry.avatarTrack?.stop();
    windows.delete(id);

    if (closeWindow && !entry.win.closed) {
        entry.win.close();
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
 * Opens a new second-screen window (or updates an existing one) to render its
 * configured source. The window is placed on a physical screen via the Window
 * Management API and auto-fullscreened; both require the window-management and
 * AutomaticFullscreen permissions on a managed/kiosk device.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {number} screenId - Optional target screen index.
 * @returns {Promise<void>}
 */
export async function openOrUpdateSecondScreen(store: IStore, id: string, screenId?: number): Promise<void> {
    if (!isSecondScreenEnabled(store.getState())) {
        APP.API?.notifySecondScreenError?.({ id, error: 'second-screen-disabled' });

        return;
    }

    const existing = windows.get(id);

    if (existing) {
        if (!existing.win.closed) {
            applySource(store, id);

            return;
        }

        // The window was closed without us being notified; purge the stale entry (stopping its
        // tracks) before reopening, so no handle to a closed window is retained.
        teardown(id, false);
    }

    let features;

    try {
        features = await computeFeatures(screenId);
    } catch (e) {
        logger.warn(`Window Management API unavailable; cannot place second-screen window "${id}"`, e);
        APP.API?.notifySecondScreenError?.({ id, error: 'window-management-unavailable' });
        store.dispatch(removeSecondScreen(id));

        return;
    }

    const win = window.open('', `jitsiSecondScreen_${id}`, features);

    if (!win) {
        logger.warn(`Failed to open second-screen window "${id}" (popup blocked?)`);
        APP.API?.notifySecondScreenError?.({ id, error: 'popup-blocked' });
        store.dispatch(removeSecondScreen(id));

        return;
    }

    const entry: IWindowEntry = { win, video: buildWindow(win) };

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
