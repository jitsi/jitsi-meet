import createCache, { EmotionCache } from '@emotion/cache';

import { IReduxState, IStore } from '../app/types';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media/constants';
import { getParticipantById } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { getTrackByMediaTypeAndParticipant, getVideoTrackByParticipant } from '../base/tracks/functions.any';
import { getLargeVideoParticipant } from '../large-video/functions';

import { removeSecondScreen, setSecondScreenWindow } from './actions.web';
import logger from './logger';
import { ISecondScreenSource } from './types';

// The Window Management API typings (Window.getScreenDetails, ScreenDetails, ScreenDetailed) come
// from the `@types/webscreens-window-placement` devDependency.

/**
 * Emotion cache key for second-screen windows. Each window gets its own cache
 * whose container is that window's {@code head}.
 */
const SECOND_SCREEN_CACHE_KEY = 'secondscreen';

/**
 * The live, non-serializable handle backing a single second-screen window. It is
 * stored on the redux entry (typed opaquely there as {@code unknown} because the
 * shared/native build has no DOM lib) and read back with a cast. React renders the
 * window's content into {@code root} via a portal, so the handle carries the
 * window, its portal root, and a per-window Emotion cache; the rendered
 * tracks/avatars are owned by the React tree and stopped on unmount.
 */
export interface ISecondScreenHandle {

    /**
     * The per-window Emotion cache (its {@code container} is this window's
     * {@code head}), so the MUI/tss-react styles of the portaled components inject
     * straight into the window in dev and prod, instead of being copied across
     * documents (which breaks under Emotion's production "speedy" insertRule mode).
     */
    cache: EmotionCache;

    /**
     * The full-bleed root element in the second window that React portals the
     * window's content into.
     */
    root: HTMLElement;

    /**
     * The second-screen window itself.
     */
    win: Window;
}

/**
 * Returns the live window handle for a second screen, or {@code undefined} if
 * its window has not been opened yet.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} id - The window id.
 * @returns {ISecondScreenHandle | undefined}
 */
export function getHandle(state: IReduxState, id: string): ISecondScreenHandle | undefined {
    return state['features/multi-screen'].screens[id]?.handle as ISecondScreenHandle | undefined;
}

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
export function resolveSource(state: IReduxState, source: ISecondScreenSource) {
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
 * Builds the (empty) second-screen document: a full-bleed root on black that
 * React portals the window's content into. Uses element styles (not a
 * stylesheet/inline script) to stay CSP-safe.
 *
 * @param {Window} win - The opened window.
 * @returns {HTMLElement}
 */
function buildWindow(win: Window): HTMLElement {
    const doc = win.document;

    doc.title = 'Jitsi Meet';
    Object.assign(doc.documentElement.style, { height: '100%' });
    Object.assign(doc.body.style, { margin: '0', height: '100%', background: '#000', overflow: 'hidden' });

    const root = doc.createElement('div');

    Object.assign(root.style, { position: 'fixed', inset: '0', width: '100%', height: '100%' });
    doc.body.appendChild(root);

    return root;
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
 * Re-resolves a window's source and notifies the embedder of the participant now
 * backing it. The actual rendering is performed by the React portal observing the
 * same redux state ({@code SecondScreenView}); this only keeps the external-API
 * {@code secondScreenSourceChanged} event in sync (e.g. on active-speaker change).
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @returns {void}
 */
function applySource(store: IStore, id: string) {
    const state = store.getState();
    const entry = state['features/multi-screen'].screens[id];

    if (!entry) {
        return;
    }
    const { participant } = resolveSource(state, entry.source);

    notifySourceChanged(id, entry.source, participant?.id ?? null);
}

/**
 * Closes the handle's window if requested. The rendered tracks/avatars and the
 * window's Emotion cache are owned by the React portal and torn down when it
 * unmounts; the redux entry is removed by the caller's action.
 *
 * @param {ISecondScreenHandle} handle - The window handle.
 * @param {boolean} closeWindow - Whether to close the OS window.
 * @returns {void}
 */
function teardownHandle(handle: ISecondScreenHandle, closeWindow: boolean) {
    if (closeWindow && !handle.win.closed) {
        handle.win.close();
    }
}

/**
 * Handles the user closing a second-screen window directly: remove it from
 * state, which tears it down and notifies the embedder via the REMOVE handler.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @returns {void}
 */
function handleWindowClosed(store: IStore, id: string) {
    if (!getHandle(store.getState(), id)) {
        return;
    }
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

    const existing = getHandle(store.getState(), id);

    if (existing && !existing.win.closed) {
        applySource(store, id);

        return;
    }

    // If a previous window was closed without notifying us, its handle is
    // overwritten below and React unmounts its portal content (stopping the cloned
    // track and its Emotion cache) on its own, so there is nothing to tear down.

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

    const handle: ISecondScreenHandle = {
        cache: createCache({ container: win.document.head, key: SECOND_SCREEN_CACHE_KEY }),
        root: buildWindow(win),
        win
    };

    store.dispatch(setSecondScreenWindow(id, handle));
    win.addEventListener('pagehide', () => handleWindowClosed(store, id), { once: true });

    try {
        await win.document.documentElement.requestFullscreen();
    } catch (e) {
        logger.debug(`Auto-fullscreen not granted for second screen "${id}"`, e);
    }

    applySource(store, id);
}

/**
 * Closes a window from an already-captured handle and notifies the embedder. The
 * caller captures the handle and removes the redux entry first (unmounting the
 * portal, which stops the cloned track, while the window is still open), then
 * calls this to close the window.
 *
 * @param {ISecondScreenHandle | undefined} handle - The captured window handle.
 * @param {string} id - The window id.
 * @returns {void}
 */
export function closeSecondScreenHandle(handle: ISecondScreenHandle | undefined, id: string) {
    if (!handle) {
        return;
    }
    teardownHandle(handle, true);
    APP.API?.notifySecondScreenClosed?.({ id });
}

/**
 * Closes a single second-screen window by reading its handle from state. Used for
 * bulk teardown (conference end); single removals use the captured-handle path
 * ({@link closeSecondScreenHandle}) in the middleware.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @returns {void}
 */
export function closeSecondScreen(store: IStore, id: string) {
    closeSecondScreenHandle(getHandle(store.getState(), id), id);
}

/**
 * Closes every second-screen window.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
export function closeAllSecondScreens(store: IStore) {
    Object.keys(store.getState()['features/multi-screen'].screens).forEach(id => closeSecondScreen(store, id));
}

/**
 * Re-resolves and re-renders every open second-screen window. Called by the
 * subscriber when the active speaker / tracks change.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
export function refreshSecondScreens(store: IStore) {
    Object.keys(store.getState()['features/multi-screen'].screens).forEach(id => {
        const handle = getHandle(store.getState(), id);

        if (handle?.win.closed) {
            handleWindowClosed(store, id);
        } else if (handle) {
            applySource(store, id);
        }
    });
}
