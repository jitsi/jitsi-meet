import createCache, { EmotionCache } from '@emotion/cache';

import { IReduxState, IStore } from '../app/types';
import { getURLWithoutParams } from '../base/connection/utils';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media/constants';
import { getParticipantById, isScreenShareParticipant } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import {
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant,
    getVirtualScreenshareParticipantTrack
} from '../base/tracks/functions.any';
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
 * The app's base font stack, mirroring the baseFontFamily SCSS variable. The
 * second window does not load the app's global stylesheet, so without setting this
 * on its body the text falls back to the browser default serif font. The
 * open_sanslight webfont is also not loaded in the popup, so it falls through to
 * the system sans-serif, which is the intended look.
 */
const SECOND_SCREEN_FONT_FAMILY
    = '-apple-system, BlinkMacSystemFont, open_sanslight, \'Helvetica Neue\', Helvetica, Arial, sans-serif';

/**
 * How long to wait for a second-screen window to load its shell page before
 * giving up on it and closing it.
 */
const SECOND_SCREEN_LOAD_TIMEOUT = 10000;

/**
 * How often the load wait re-checks whether the window was closed. A window
 * closed mid-load fires no {@code load} event, so without polling the wait would
 * only end on the timeout above.
 */
const SECOND_SCREEN_LOAD_POLL_INTERVAL = 250;

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

        // A virtual screenshare participant (<owner>-v<n>) owns no track under its
        // own id: its screenshare track is owned by the endpoint id, so resolve it
        // through the owner, else a pinned screenshare falls back to the avatar. For
        // a real participant, media selects camera vs. screen, keeping the surface
        // identical to the external API on master.
        iTrack = isScreenShareParticipant(participant)
            ? getVirtualScreenshareParticipantTrack(tracks, source.participant)
            : getTrackByMediaTypeAndParticipant(
                tracks,
                source.media === 'desktop' ? MEDIA_TYPE.SCREENSHARE : MEDIA_TYPE.VIDEO,
                source.participant);
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
 * Computes the tile-grid dimensions (columns and rows) for a number of
 * participants, using a Jitsi-style heuristic:
 * {@code columns = min(ceil(sqrt(n)), maxColumns, n)}. Pure, so it is easy to
 * unit-test in isolation.
 *
 * @param {number} count - The number of participants to lay out.
 * @param {number} maxColumns - The maximum number of columns allowed.
 * @returns {Object} The grid dimensions as { columns, rows }.
 */
export function getGalleryGridDimensions(count: number, maxColumns: number): { columns: number; rows: number; } {
    if (count <= 0) {
        return { columns: 1, rows: 1 };
    }

    const columns = Math.min(Math.ceil(Math.sqrt(count)), maxColumns, count);
    const rows = Math.ceil(count / columns);

    return { columns, rows };
}

/**
 * Builds the URL of the static shell page a second-screen window loads
 * ({@code static/secondScreen.html}). Derived from the canonical meeting
 * location the same way the whiteboard page URL is, so tenant paths keep
 * working; falls back to {@code window.location} before the connection is up.
 *
 * The window loads a real same-origin page instead of {@code about:blank}
 * because embeds rendered inside it (e.g. the YouTube shared-video player)
 * require the embedding page to send a valid referrer, which an
 * {@code about:blank} document cannot (YouTube fails with error 153).
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
function getSecondScreenPageUrl(state: IReduxState): string {
    const locationURL = state['features/base/connection'].locationURL;
    const href = locationURL
        ? getURLWithoutParams(locationURL).href
        : `${window.location.origin}${window.location.pathname}`;

    return `${href.substring(0, href.lastIndexOf('/'))}/static/secondScreen.html`;
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
 * Whether a second-screen window has already loaded its shell page, in which
 * case waiting for its {@code load} event would never resolve (the event has
 * already fired). Happens when a window is opened again for an id whose window
 * is still open, since {@code window.open} reuses the window with the same name.
 * A freshly opened window's initial empty document can also report itself as
 * complete, hence the URL check.
 *
 * @param {Window} win - The opened window.
 * @returns {boolean}
 */
function isShellPageLoaded(win: Window): boolean {
    try {
        return win.document.readyState === 'complete' && win.location.href !== 'about:blank';
    } catch (_e) {
        // Mid-navigation (or an unreadable document); treat it as not loaded and wait.
        return false;
    }
}

/**
 * Waits for a freshly opened second-screen window to load its shell page (see
 * {@link getSecondScreenPageUrl}), so the handle (root, Emotion cache,
 * listeners) is built on the real document and not wiped by the navigation. The
 * Window object is reused for this first navigation, so the listener attached
 * here survives it and fires on the page load.
 *
 * Resolves with whether the page actually loaded. A window closed mid-load, or a
 * navigation that stalls or fails (the shell page is not served), fires no
 * {@code load} at all, so the wait is bounded by a poll for {@code win.closed}
 * and a timeout. Without them the promise would stay pending forever: the
 * caller's {@code .catch} cannot fire, the redux entry keeps a source with no
 * handle that nothing reconciles, and a window that did open is stranded on the
 * external display with no handle in state for anything to close it by.
 *
 * @param {Window} win - The opened window.
 * @returns {Promise<boolean>}
 */
function awaitSecondScreenLoad(win: Window): Promise<boolean> {
    if (isShellPageLoaded(win)) {
        return Promise.resolve(true);
    }

    return new Promise<boolean>(resolve => {
        let poll = 0;
        let timeout = 0;
        let settled = false;

        const finish = (loaded: boolean) => {
            if (settled) {
                return;
            }
            settled = true;
            window.clearInterval(poll);
            window.clearTimeout(timeout);
            resolve(loaded);
        };

        win.addEventListener('load', () => finish(true), { once: true });

        poll = window.setInterval(() => {
            if (win.closed) {
                finish(false);
            }
        }, SECOND_SCREEN_LOAD_POLL_INTERVAL);
        timeout = window.setTimeout(() => finish(false), SECOND_SCREEN_LOAD_TIMEOUT);
    });
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

    // The popup does not load the app's global stylesheet, so set the base
    // typography (font + text colour) here, otherwise text falls back to the
    // browser default serif font in black.
    Object.assign(doc.body.style, {
        margin: '0',
        height: '100%',
        background: '#000',
        color: '#fff',
        fontFamily: SECOND_SCREEN_FONT_FAMILY,
        overflow: 'hidden'
    });

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

    const win = window.open(getSecondScreenPageUrl(store.getState()), `jitsiSecondScreen_${id}`, features);

    if (!win) {
        logger.warn(`Failed to open second-screen window "${id}" (popup blocked?)`);
        APP.API?.notifySecondScreenError?.({ id, error: 'popup-blocked' });
        store.dispatch(removeSecondScreen(id));

        return;
    }

    // Wait for the shell page to replace the popup's initial empty document
    // before building the handle on it.
    const loaded = await awaitSecondScreenLoad(win);

    if (!loaded || win.closed) {

        // Close the window on the way out: a navigation that stalled (or a
        // shell page that is not served) still leaves a window on the external
        // display, and it never reaches state, so nothing else would ever be
        // able to close it.
        if (!win.closed) {
            win.close();
        }

        logger.warn(`Second-screen window "${id}" was closed or failed to load its page`);
        APP.API?.notifySecondScreenError?.({ id, error: 'window-load-failed' });
        store.dispatch(removeSecondScreen(id));

        return;
    }

    // A removal (or a conference end) can land while the window is loading. Its
    // handle is not in state yet, so closeSecondScreenHandle had nothing to
    // close: close the window here instead of building a handle for an entry
    // that is gone, which the reducer would drop anyway. Everything from here to
    // setSecondScreenWindow is synchronous, so no dispatch can interleave.
    if (!store.getState()['features/multi-screen'].screens[id]) {
        win.close();
        APP.API?.notifySecondScreenClosed?.({ id });

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
