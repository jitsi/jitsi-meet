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
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { removeSecondScreen, setSecondScreenWindow } from './actions.web';
import { UI_SECOND_SCREEN_ID_PREFIX } from './constants';
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
 * The name of the {@code meta} marker carried by the shell page (see
 * {@link getSecondScreenPageUrl}). A {@code load} event only says that
 * *something* was served, so the marker is what tells the shell apart from a 404
 * body, an SSO/CDN redirect landing, or (in dev) a proxied response from the
 * dev-server target. Without it the handle would be built on that document and
 * the portal root would silently paint over it.
 */
const SECOND_SCREEN_MARKER = 'jitsi-second-screen';

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
        // A screenshare sent from its own tile names the virtual screenshare
        // participant that owns it, so the right one is rendered when several
        // are live at once; without one, fall back to whatever is being shared.
        if (source.participant) {
            iTrack = getVirtualScreenshareParticipantTrack(tracks, source.participant);
            participant = getParticipantById(state, source.participant);
        } else {
            iTrack = tracks.find(t => t.videoType === VIDEO_TYPE.DESKTOP && !t.muted && Boolean(t.jitsiTrack));
            participant = iTrack ? getParticipantById(state, iTrack.participantId) : undefined;
        }
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
 * The {@code ScreenDetails} object, cached after the first successful call. The
 * object is live (the browser keeps its {@code screens} and
 * {@code currentScreen} up to date and fires {@code screenschange}), so it never
 * needs to be invalidated, and caching it is what lets a window be opened
 * synchronously: {@code window.open} then runs in the same task as the click
 * that asked for it, keeping the user activation that the popup blocker
 * requires.
 */
let screenDetails: ScreenDetails | undefined;

/**
 * Returns the cached {@code ScreenDetails}, or {@code undefined} if it has not
 * been obtained yet (see {@link loadScreenDetails}).
 *
 * @returns {ScreenDetails | undefined}
 */
export function getCachedScreenDetails(): ScreenDetails | undefined {
    return screenDetails;
}

/**
 * Obtains and caches the {@code ScreenDetails}. The first call requests the
 * window-management permission, so it may prompt.
 *
 * @returns {Promise<ScreenDetails>}
 */
export async function loadScreenDetails(): Promise<ScreenDetails> {
    screenDetails = screenDetails ?? await window.getScreenDetails();

    return screenDetails;
}

/**
 * Pre-loads the {@code ScreenDetails} when the window-management permission has
 * already been granted, so the first in-app trigger can open its window without
 * awaiting anything. Deliberately does not prompt: permission is only ever
 * requested by an actual open, never just to decide what to draw.
 *
 * @returns {void}
 */
export function preloadScreenDetails() {
    if (screenDetails || !isSecondScreenSupported()) {
        return;
    }

    navigator.permissions?.query({ name: 'window-management' as PermissionName })
        .then(status => (status.state === 'granted' ? loadScreenDetails() : undefined))
        .catch(e => logger.debug('Could not pre-load the screen details', e));
}

/**
 * The indices of the screens the meeting window is not on, in the order the
 * Window Management API reports them.
 *
 * @param {ScreenDetails} details - The screen details.
 * @returns {number[]}
 */
function getExternalScreenIndices(details: ScreenDetails): number[] {
    const { currentScreen } = details;

    return details.screens
        .map((screen, index) => ({ screen,
            index }))
        .filter(({ screen }) => screen.left !== currentScreen.left || screen.top !== currentScreen.top)
        .map(({ index }) => index);
}

/**
 * Picks which second-screen window an in-app trigger should target. Each screen
 * shows its own source, so a trigger fills the first external screen that has no
 * window yet; once they all have one it takes over the window this feature
 * targeted longest ago. Windows opened through the external API are never taken
 * over, only counted as occupying their screen.
 *
 * Falls back to a single window on the current screen when there is no external
 * screen at all, which is what {@link computeFeatures} places it on.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object} The window id to target and the screen index to place it on.
 */
export function pickSecondScreenTarget(state: IReduxState): { id: string; screenId?: number; } {
    const details = screenDetails;
    const external = details ? getExternalScreenIndices(details) : [];

    if (!external.length) {
        return { id: `${UI_SECOND_SCREEN_ID_PREFIX}0` };
    }

    const { screens } = state['features/multi-screen'];

    // An entry with no explicit screenId went to the first external screen,
    // which is what computeFeatures picks for it.
    const taken = new Set(Object.values(screens).map(entry => entry.screenId ?? external[0]));
    const free = external.find(index => !taken.has(index));

    if (typeof free === 'number') {
        return { id: `${UI_SECOND_SCREEN_ID_PREFIX}${free}`,
            screenId: free };
    }

    const ours = Object.entries(screens).filter(([ id ]) => id.startsWith(UI_SECOND_SCREEN_ID_PREFIX));

    // Every screen is taken by the embedder's windows: open on the first one
    // anyway rather than taking one of them over.
    if (!ours.length) {
        return { id: `${UI_SECOND_SCREEN_ID_PREFIX}${external[0]}`,
            screenId: external[0] };
    }

    const [ id, entry ] = ours.reduce((oldest, current) =>
        ((current[1].setAt ?? 0) < (oldest[1].setAt ?? 0) ? current : oldest));

    return { id,
        screenId: entry.screenId ?? external[0] };
}

/**
 * Whether two source descriptors select the same thing, so a trigger can tell
 * that what it would send is already on a second screen. Only {@code media} is
 * defaulted: an absent {@code role} is not the same as {@code 'stage'} (it pins
 * the named participant rather than following the large video), so the roles are
 * compared as they are.
 *
 * @param {ISecondScreenSource} a - A source descriptor.
 * @param {ISecondScreenSource} b - The source descriptor to compare it against.
 * @returns {boolean}
 */
export function isSameSecondScreenSource(a?: ISecondScreenSource, b?: ISecondScreenSource): boolean {
    if (!a || !b) {
        return false;
    }

    return a.role === b.role
        && a.participant === b.participant
        && (a.media ?? 'camera') === (b.media ?? 'camera');
}

/**
 * The id of the in-app second-screen window already showing {@code source}, if
 * there is one. Only the in-app windows are considered, for the same reason
 * {@link pickSecondScreenTarget} only takes those over: a trigger must not turn
 * off a window the embedder opened and is managing through the external API.
 *
 * @param {IReduxState} state - The redux state.
 * @param {ISecondScreenSource} source - The source to look for.
 * @returns {string | undefined} The window id, if any.
 */
export function getSecondScreenShowing(state: IReduxState, source: ISecondScreenSource): string | undefined {
    const { screens } = state['features/multi-screen'];

    return Object.keys(screens).find(id =>
        id.startsWith(UI_SECOND_SCREEN_ID_PREFIX) && isSameSecondScreenSource(screens[id].source, source));
}

/**
 * Computes the {@code window.open} features string, placing the window on a
 * physical screen via the Window Management API.
 *
 * @param {ScreenDetails} details - The screen details.
 * @param {number} screenId - Optional target screen index.
 * @returns {string}
 */
function computeFeatures(details: ScreenDetails, screenId?: number): string {
    const target = (typeof screenId === 'number' && details.screens[screenId])
        || details.screens.find(s => s.left !== details.currentScreen.left || s.top !== details.currentScreen.top)
        || details.currentScreen;

    // No avail* offsets: the window is auto-fullscreened, so the full screen bounds are what matter.
    return `popup,left=${target.left},top=${target.top},width=${target.width},height=${target.height}`;
}

/**
 * Whether the document currently in a second-screen window is the shell page,
 * identified by its {@code meta} marker (see {@link SECOND_SCREEN_MARKER}) rather
 * than by its URL: the URL is only what was requested, while the marker is proof
 * of what was actually served. Also covers the initial empty document, which
 * carries no marker.
 *
 * @param {Window} win - The opened window.
 * @returns {boolean}
 */
function hasShellMarker(win: Window): boolean {
    try {
        return Boolean(win.document.querySelector(`meta[name="${SECOND_SCREEN_MARKER}"]`));
    } catch (_e) {
        // Unreadable document: mid-navigation, or cross-origin after a redirect
        // of the shell URL, which makes every document access throw.
        return false;
    }
}

/**
 * The URL a second-screen window actually ended up on, for diagnostics, or
 * {@code undefined} when it cannot be read (a cross-origin document).
 *
 * @param {Window} win - The opened window.
 * @returns {string | undefined}
 */
function readWindowLocation(win: Window): string | undefined {
    try {
        return win.location.href;
    } catch (_e) {
        return undefined;
    }
}

/**
 * How a wait for a second-screen window's shell page ended: the shell loaded,
 * the window was closed while it was loading, the load timed out, or something
 * other than the shell page was served. They are reported differently: only the
 * last two are errors, and a window the user closed mid-load is the same user
 * action as closing it a moment later, so it must produce the same event.
 */
type SecondScreenLoadResult = 'loaded' | 'closed' | 'timeout' | 'wrong-page';

/**
 * Waits for a freshly opened second-screen window to load its shell page (see
 * {@link getSecondScreenPageUrl}), so the handle (root, Emotion cache,
 * listeners) is built on the real document and not wiped by the navigation. The
 * Window object is reused for this first navigation, so the listener attached
 * here survives it and fires on the page load.
 *
 * Resolves with how the wait ended (see {@link SecondScreenLoadResult}). A
 * window closed mid-load, or a navigation that stalls, fires no {@code load} at
 * all, so the wait is bounded by a poll for {@code win.closed} and a timeout.
 * Without them the promise would stay pending forever: the caller's
 * {@code .catch} cannot fire, the redux entry keeps a source with no handle that
 * nothing reconciles, and a window that did open is stranded on the external
 * display with no handle in state for anything to close it by. A {@code load}
 * that delivered something other than the shell page is reported separately,
 * since the event fires for any served response.
 *
 * There is deliberately no fast path for a window that has already loaded: the
 * caller always opens with the shell URL, and navigating a reused named context
 * loads it again, so {@code load} is always still to come. A document that reads
 * as complete here is a stale outgoing one, which carries the marker too, so
 * taking it would build the handle on a document that is about to be replaced.
 *
 * @param {Window} win - The opened window.
 * @returns {Promise<SecondScreenLoadResult>}
 */
function awaitSecondScreenLoad(win: Window): Promise<SecondScreenLoadResult> {
    return new Promise<SecondScreenLoadResult>(resolve => {
        let poll = 0;
        let timeout = 0;
        let settled = false;

        const finish = (result: SecondScreenLoadResult) => {
            if (settled) {
                return;
            }
            settled = true;
            window.clearInterval(poll);
            window.clearTimeout(timeout);
            resolve(result);
        };

        // The marker is checked here, on load, rather than by the caller: this is
        // the document the handle would be built on, and a later navigation
        // (which nothing else triggers) would not change the verdict.
        win.addEventListener('load', () => finish(hasShellMarker(win) ? 'loaded' : 'wrong-page'), { once: true });

        poll = window.setInterval(() => {
            if (win.closed) {
                finish('closed');
            }
        }, SECOND_SCREEN_LOAD_POLL_INTERVAL);
        timeout = window.setTimeout(() => finish('timeout'), SECOND_SCREEN_LOAD_TIMEOUT);
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
 * The ids whose windows are currently being opened, i.e. the calls that are past
 * the handle check below but have not stored a handle yet.
 */
const opening = new Set<string>();

/**
 * Tears down a second-screen open that failed: closes the window if one is still
 * open, tells the embedder why, and drops the redux entry. Every failure path
 * runs all three, so none of them can leave a window on the external display
 * with no handle in state (nothing else would be able to close it, not even the
 * end of the conference) or an entry holding a source with no window.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {string} error - The error reported to the embedder.
 * @param {Window} win - The window to close, if it was opened at all.
 * @returns {void}
 */
function failSecondScreenOpen(store: IStore, id: string, error: string, win?: Window | null) {
    if (win && !win.closed) {
        win.close();
    }

    APP.API?.notifySecondScreenError?.({ id, error });
    notifySecondScreenOpenFailed(store, id, error);
    store.dispatch(removeSecondScreen(id));
}

/**
 * The notification shown for a failed in-app send, keyed by the error reported
 * to the embedder. The two listed here are the ones the user can act on; the
 * rest fall back to a generic message.
 */
const OPEN_ERROR_DESCRIPTIONS: { [error: string]: string; } = {
    'popup-blocked': 'multiScreen.popupBlocked',
    'window-management-unavailable': 'multiScreen.permissionDenied'
};

/**
 * Tells the user that a send to a second screen failed. Only for the windows
 * opened by the in-app triggers: an embedder handles its own windows' failures
 * through {@code notifySecondScreenError}, and a notification in the meeting
 * would be talking about a window the user never asked for. Without this an
 * in-app click that is blocked does nothing observable at all.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {string} error - The error reported to the embedder.
 * @returns {void}
 */
export function notifySecondScreenOpenFailed(store: IStore, id: string, error: string) {
    if (!id.startsWith(UI_SECOND_SCREEN_ID_PREFIX)) {
        return;
    }

    store.dispatch(showWarningNotification({
        descriptionKey: OPEN_ERROR_DESCRIPTIONS[error] ?? 'multiScreen.openFailed',
        titleKey: 'multiScreen.openFailedTitle'
    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
}

/**
 * Handles an unexpected rejection from {@link openOrUpdateSecondScreen}, which is
 * otherwise all-catching. Reading the popup's document can throw now that it
 * loads a real page instead of {@code about:blank} (a cross-origin redirect of
 * the shell URL makes every access raise a {@code SecurityError}), so this runs
 * the same teardown as the handled failures rather than only logging, which would
 * land right back on the orphaned-window-plus-inert-entry state.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {any} e - The error.
 * @returns {void}
 */
export function handleSecondScreenOpenError(store: IStore, id: string, e: any) {
    logger.error(`Failed to open second screen "${id}"`, e);
    failSecondScreenOpen(store, id, 'window-setup-failed', getHandle(store.getState(), id)?.win);
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

    // A second request for the same id can arrive while the first one is still
    // opening its window: the handle above is the only other reentrancy guard and
    // it stays empty until the page has loaded. Letting a second call through
    // would reach window.open with the same window name and re-navigate (or, on
    // the initial empty document, share) the window the first call is building
    // on, which orphans load listeners, duplicates roots and pagehide listeners,
    // and can close a window that was just set up. The dropped request is not
    // re-run later, so what it leaves behind depends on how the open in flight
    // ends. If that one succeeds, nothing is lost: the source lives in redux, so
    // it applies the newest one at the end. If it fails, its teardown dispatches
    // removeSecondScreen(id), which also removes the entry the dropped request
    // had just written, leaving that request with neither a window nor an entry
    // of its own. That is accepted rather than handled: the end state is
    // consistent rather than corrupt, the embedder is told through
    // secondScreenError for the id and can retry, and whatever caused the
    // failure usually applies to both requests anyway. The window for this is
    // wider than the load timeout, since computeFeatures below raises the
    // window-management permission prompt, which sits until the user answers it
    // and lands on window-management-unavailable if they deny it. A screenId that
    // changed in the meantime is ignored, exactly as it is for a window that is
    // already open.
    if (opening.has(id)) {
        return;
    }

    opening.add(id);

    try {
        await openSecondScreenWindow(store, id, screenId);
    } finally {
        opening.delete(id);
    }
}

/**
 * Opens and sets up the window for an id, having established that it has no live
 * window and no other open in flight (see {@link openOrUpdateSecondScreen}).
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {number} screenId - Optional target screen index.
 * @returns {Promise<void>}
 */
async function openSecondScreenWindow(store: IStore, id: string, screenId?: number): Promise<void> {

    // If a previous window was closed without notifying us, its handle is
    // overwritten below and React unmounts its portal content (stopping the cloned
    // track and its Emotion cache) on its own, so there is nothing to tear down.

    let features;

    try {
        // Only awaits the first time, before the permission has been granted:
        // afterwards the details are cached, so everything up to window.open
        // below stays in the task that dispatched, and a window opened from a
        // click still counts as user-initiated to the popup blocker.
        features = computeFeatures(screenDetails ?? await loadScreenDetails(), screenId);
    } catch (e) {
        logger.warn(`Window Management API unavailable; cannot place second-screen window "${id}"`, e);
        failSecondScreenOpen(store, id, 'window-management-unavailable');

        return;
    }

    const url = getSecondScreenPageUrl(store.getState());
    const win = window.open(url, `jitsiSecondScreen_${id}`, features);

    if (!win) {
        logger.warn(`Failed to open second-screen window "${id}" (popup blocked?)`);
        failSecondScreenOpen(store, id, 'popup-blocked');

        return;
    }

    // Wait for the shell page to replace the popup's initial empty document
    // before building the handle on it.
    const result = win.closed ? 'closed' : await awaitSecondScreenLoad(win);

    if (result === 'closed' || win.closed) {

        // The user closed the popup while it was loading. That is the same action
        // as closing it a moment later, so it reports the same event rather than
        // an error, and there is no window left to close.
        logger.debug(`Second-screen window "${id}" was closed while loading`);
        store.dispatch(removeSecondScreen(id));
        APP.API?.notifySecondScreenClosed?.({ id });

        return;
    }

    if (result !== 'loaded') {

        // Close the window on the way out: a navigation that stalled, or one that
        // served something other than the shell page, still leaves a window on the
        // external display, and it never reaches state, so nothing else would ever
        // be able to close it. Log where it actually ended up: the requested URL
        // says nothing about what a proxy, a redirect or a 404 returned.
        if (result === 'timeout') {
            logger.warn(`Second-screen window "${id}" did not load "${url}" within `
                + `${SECOND_SCREEN_LOAD_TIMEOUT}ms`);
        } else {
            logger.warn(`Second-screen window "${id}" loaded "${readWindowLocation(win) ?? '<unreadable>'}" `
                + `instead of the shell page "${url}"`);
        }

        failSecondScreenOpen(store, id, 'window-load-failed', win);

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

    let handle: ISecondScreenHandle;

    try {
        handle = {
            cache: createCache({ container: win.document.head, key: SECOND_SCREEN_CACHE_KEY }),
            root: buildWindow(win),
            win
        };
    } catch (e) {

        // Reading the popup's document can throw now that it loads a real page
        // instead of about:blank: a cross-origin redirect of the shell URL makes
        // head/body raise a SecurityError. The marker check above already turns
        // most of those into 'wrong-page', so this is the last resort for one that
        // still gets here, and it tears down rather than leaving a live window
        // behind an entry with no handle.
        logger.warn(`Could not build the second-screen document for "${id}" at `
            + `"${readWindowLocation(win) ?? '<unreadable>'}"`, e);
        failSecondScreenOpen(store, id, 'window-setup-failed', win);

        return;
    }

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
