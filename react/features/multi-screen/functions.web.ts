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
import { isVideoPlaying } from '../shared-video/functions';
import { isWhiteboardPresent } from '../whiteboard/functions';

import { removeSecondScreen, setSecondScreenWindow } from './actions.web';
import { UI_SECOND_SCREEN_ID_PREFIX } from './constants';
import logger from './logger';
import { ISecondScreenEntry, ISecondScreenSource } from './types';

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
 * How long to wait for the window-management permission before giving up on
 * placing a window. A call to {@code getScreenDetails()} does not settle while
 * its prompt is on screen, and one that is never answered never settles it at
 * all. The prompt is only ever raised where the call carries transient user
 * activation, which is the in-app triggers; without it Chromium rejects at once
 * with {@code NotAllowedError}, which is why the external API path fails fast
 * rather than hanging, and why headless does too. Without a bound the window
 * would sit unplaced on the meeting's own screen indefinitely, with nobody told
 * anything either way. Generous enough for someone to read the prompt before
 * answering, and a later answer is not wasted, since {@link loadScreenDetails}
 * still caches the result for the next attempt.
 */
const SECOND_SCREEN_PERMISSION_TIMEOUT = 30000;

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
 * A stable signature of what a single source should currently render. Includes
 * the avatar identity (id/url/name) so the fallback avatar redraws even while no
 * track is present.
 *
 * @param {IReduxState} state - The redux state.
 * @param {ISecondScreenSource} source - The source descriptor.
 * @returns {string}
 */
function getSourceSignature(state: IReduxState, source: ISecondScreenSource): string {

    // The shared video and the whiteboard resolve to neither a track nor a
    // participant (each owns its own element: a player, an iframe), so what has
    // to be signed is whether the thing is there at all. Without this both sign
    // as the constant `avatar:::`, so stopping the share or closing the
    // whiteboard reads exactly like still having it and nothing re-runs.
    if (source.role === 'sharedvideo') {
        return `sharedvideo:${isVideoPlaying(state)}`;
    }

    if (source.role === 'whiteboard') {
        return `whiteboard:${isWhiteboardPresent(state)}`;
    }

    const { track, participant } = resolveSource(state, source);

    return track
        ? track.id
        : `avatar:${participant?.id ?? ''}:${participant?.loadableAvatarUrl ?? ''}:${participant?.name ?? ''}`;
}

/**
 * A stable signature of what every second-screen window should currently render.
 * When it changes — the active speaker switches, a source mutes/unmutes, an
 * avatar finishes loading, or a source goes away entirely — the subscriber
 * re-applies the sources, swapping the window content in place.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
export function getSecondScreenSignature(state: IReduxState): string {
    const { screens } = state['features/multi-screen'];

    return Object.keys(screens).sort()
        .map(id => `${id}:${getSourceSignature(state, screens[id].source)}`)
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
 * object is live: the browser keeps its {@code screens} and
 * {@code currentScreen} up to date as displays come and go, so it never needs to
 * be invalidated. Nothing subscribes to its {@code screenschange} event either,
 * because every read happens at the point of use. That matters for the indices
 * into {@code screens}: the browser renumbers the array on a display change, so
 * an index only means anything at the moment it is read, which is why occupancy
 * is derived from where the windows actually are (see
 * {@link getWindowScreenIndex}) rather than from the indices they were opened
 * with.
 *
 * Caching it is also what lets a window be opened synchronously:
 * {@code window.open} then runs in the same task as the click that asked for it,
 * keeping the user activation that the popup blocker requires.
 */
let screenDetails: ScreenDetails | undefined;

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
 * Bounds a wait on the screen details, so an open cannot be left pending forever
 * behind a permission prompt nobody answers (see
 * {@link SECOND_SCREEN_PERMISSION_TIMEOUT}). Rejects on the timeout, which the
 * caller treats exactly like a denial: either way the window cannot be placed.
 *
 * @param {Promise<ScreenDetails>} pending - The in-flight request.
 * @returns {Promise<ScreenDetails>}
 */
function awaitScreenDetails(pending: Promise<ScreenDetails>): Promise<ScreenDetails> {
    return new Promise<ScreenDetails>((resolve, reject) => {
        const timeout = setTimeout(
            () => reject(new Error('Timed out waiting for the window-management permission')),
            SECOND_SCREEN_PERMISSION_TIMEOUT);

        pending.then(resolve, reject).finally(() => clearTimeout(timeout));
    });
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
 * The index of the screen a live second-screen window is actually on, derived
 * from the window's own position in the multi-screen coordinate space. The
 * {@code screenId} on its entry cannot answer this: it records where the window
 * was asked to go at open time, and a window is never re-placed afterwards
 * (neither when the user drags it nor when the browser renumbers
 * {@code details.screens} on a display change), so it goes stale while the
 * window stays put. Uses the window's centre, so one straddling a boundary
 * counts as being on the screen showing most of it.
 *
 * @param {ScreenDetails} details - The screen details.
 * @param {Window} win - The window to locate.
 * @returns {number | undefined} The screen index, or {@code undefined} if the
 * window could not be read or sits outside every reported screen.
 */
function getWindowScreenIndex(details: ScreenDetails, win: Window): number | undefined {
    let index;

    try {
        const x = win.screenLeft + (win.outerWidth / 2);
        const y = win.screenTop + (win.outerHeight / 2);

        index = details.screens.findIndex(screen =>
            x >= screen.left && x < screen.left + screen.width
                && y >= screen.top && y < screen.top + screen.height);
    } catch (_e) {

        // The second-screen windows are same-origin by the time they have a
        // handle, so this is not expected. Answering "unknown" rather than
        // guessing a screen leaves it to the caller, which fails closed (see
        // {@link getEntryScreenIndex}).
        return undefined;
    }

    return index === -1 ? undefined : index;
}

/**
 * The screen a second-screen entry counts as being on: where its window actually
 * is, else the screen it asked for, else {@code fallback} (an entry that named
 * no screen is placed on the first external one, which is what
 * {@link getTargetScreen} does with it).
 *
 * The position is preferred because {@code screenId} only records where the
 * window was asked to go at open time: a window is never re-placed afterwards,
 * so it goes stale when the user drags the window or the browser renumbers
 * {@code details.screens} on a display change. Falling back rather than
 * answering "nowhere" is deliberate: a window whose position cannot be read
 * (still opening, or centred outside every reported screen, as a minimized
 * popup may report) still holds a screen, and treating it as free would open
 * another window on top of it.
 *
 * @param {ScreenDetails} details - The screen details.
 * @param {ISecondScreenEntry} entry - The entry to locate.
 * @param {number} fallback - The screen an entry that named none is placed on.
 * @returns {number}
 */
function getEntryScreenIndex(details: ScreenDetails, entry: ISecondScreenEntry, fallback: number): number {
    const win = (entry.handle as ISecondScreenHandle | undefined)?.win;

    // A ternary rather than && so an unreadable position and a window without a
    // handle both arrive here as undefined; ?? would pass a false straight
    // through as the answer.
    const index = win && !win.closed ? getWindowScreenIndex(details, win) : undefined;

    return index ?? entry.screenId ?? fallback;
}

/**
 * The screen indices the second-screen windows currently occupy. Read from the
 * live windows rather than from the entries, so it survives the browser
 * renumbering the screens and follows a window the user moved.
 *
 * @param {ScreenDetails} details - The screen details.
 * @param {Object} screens - The second-screen entries.
 * @param {number} fallback - The screen an entry that named none is placed on,
 * i.e. what {@link getTargetScreen} picks for it.
 * @returns {Set<number>}
 */
function getOccupiedScreens(
        details: ScreenDetails,
        screens: { [id: string]: ISecondScreenEntry; },
        fallback: number): Set<number> {
    const occupied = new Set<number>();

    Object.values(screens).forEach(entry => {
        const win = (entry.handle as ISecondScreenHandle | undefined)?.win;

        // A window the user closed by hand frees its screen. One that has no
        // handle yet does not: it is still opening onto the screen it asked for.
        if (win?.closed) {
            return;
        }

        occupied.add(getEntryScreenIndex(details, entry, fallback));
    });

    return occupied;
}

/**
 * An id no second-screen window is using. Deliberately carries no screen index:
 * occupancy is positional now, and an id that encodes a screen is a second,
 * conflicting answer to "which window is on that screen" that goes stale the
 * moment a display is undocked. It only has to be unique, or a "nothing is on
 * that screen, open one" decision hands back the id of a window that exists and
 * re-sources it instead, leaving the screen empty.
 *
 * @param {Object} screens - The second-screen entries.
 * @returns {string}
 */
function mintSecondScreenId(screens: { [id: string]: ISecondScreenEntry; }): string {
    let n = 0;

    while (screens[`${UI_SECOND_SCREEN_ID_PREFIX}${n}`]) {
        n++;
    }

    return `${UI_SECOND_SCREEN_ID_PREFIX}${n}`;
}

/**
 * Picks which second-screen window an in-app trigger should target. Each screen
 * shows its own source, so a trigger fills the first external screen that has no
 * window on it; once they all have one it takes over the window this feature
 * targeted longest ago, on the screen that window is on now. Windows opened
 * through the external API are never taken over, only counted as occupying their
 * screen.
 *
 * Falls back to a single window on the current screen when there is no external
 * screen at all, which is what {@link getTargetScreen} places it on. That is
 * also the answer before the screen details have been obtained: the very first
 * send cannot enumerate the screens without prompting for the window-management
 * permission, and the open does that (see {@link openSecondScreenWindow}).
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object} The window id to target and the screen index to place it on.
 */
export function pickSecondScreenTarget(state: IReduxState): { id: string; screenId?: number; } {
    const details = screenDetails;
    const external = details ? getExternalScreenIndices(details) : [];
    const { screens } = state['features/multi-screen'];

    // One screen, so one window: a fixed id, which re-targets the window already
    // up instead of opening another on top of it.
    if (!details || !external.length) {
        return { id: `${UI_SECOND_SCREEN_ID_PREFIX}0` };
    }

    const taken = getOccupiedScreens(details, screens, external[0]);
    const free = external.find(index => !taken.has(index));

    if (typeof free === 'number') {
        return { id: mintSecondScreenId(screens),
            screenId: free };
    }

    // Only a window that is actually on an external screen can be taken over. One
    // that has ended up on the meeting's own screen (dragged there, or relocated
    // by the browser when its display was undocked) would otherwise be the oldest
    // and get picked, putting the content on top of the meeting while the
    // external screens keep what they were already showing.
    const ours = Object.entries(screens).filter(([ id, entry ]) =>
        id.startsWith(UI_SECOND_SCREEN_ID_PREFIX)
            && external.includes(getEntryScreenIndex(details, entry, external[0])));

    // Every external screen is taken by windows this trigger must not touch:
    // open on the first one anyway rather than taking one of them over.
    if (!ours.length) {
        return { id: mintSecondScreenId(screens),
            screenId: external[0] };
    }

    const [ id, entry ] = ours.reduce((oldest, current) =>
        ((current[1].setAt ?? 0) < (oldest[1].setAt ?? 0) ? current : oldest));

    // Re-target where that window is now, not where it was first sent, so taking
    // it over does not also move it. Only used if it has to be re-opened: a
    // window that is still up keeps its position either way.
    return { id,
        screenId: getEntryScreenIndex(details, entry, external[0]) };
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
 * Whether what a source names has gone from the meeting, leaving its window with
 * nothing to render. Every in-app trigger lives on the thing it sends (a
 * screenshare's own thumbnail, the shared video's thumbnail, a participant's
 * context menu), so when that thing goes the trigger goes with it, and the only
 * control that could take the window down is gone before the user can use it.
 * What is left is a window showing an anonymous avatar on black that nobody in
 * the meeting can close, only somebody standing at the other display.
 *
 * Only a source that selects one particular thing can go away this way:
 * {@code stage} and {@code tile} follow the meeting itself, and a
 * {@code screenshare} with no participant falls back to whatever is being
 * shared. The rest are asked either by the participant they name or, where they
 * name none, by role.
 *
 * @param {IReduxState} state - The redux state.
 * @param {ISecondScreenSource} source - The source to check.
 * @returns {boolean}
 */
function isSecondScreenSourceGone(state: IReduxState, source: ISecondScreenSource): boolean {
    if (source.role === 'sharedvideo') {
        return !isVideoPlaying(state);
    }

    // Closing the whiteboard removes its fake participant, taking the tile and
    // the context menu holding the only trigger with it. The source names no
    // participant, so it has to be asked for by role like the shared video.
    if (source.role === 'whiteboard') {
        return !isWhiteboardPresent(state);
    }

    // A screenshare names the virtual participant that owns it, which is removed
    // when the share stops; anything else names a real participant, removed when
    // they leave.
    return Boolean(source.participant) && !getParticipantById(state, source.participant ?? '');
}

/**
 * The screen a second-screen window should end up on: the one it named, else the
 * first screen the meeting window is not on, else the meeting's own screen when
 * that is all there is.
 *
 * @param {ScreenDetails} details - The screen details.
 * @param {number} screenId - Optional target screen index.
 * @returns {ScreenDetailed}
 */
function getTargetScreen(details: ScreenDetails, screenId?: number): ScreenDetailed {
    return (typeof screenId === 'number' && details.screens[screenId])
        || details.screens.find(s => s.left !== details.currentScreen.left || s.top !== details.currentScreen.top)
        || details.currentScreen;
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
    const target = getTargetScreen(details, screenId);

    // No avail* offsets: the window is auto-fullscreened, so the full screen bounds are what matter.
    return `popup,left=${target.left},top=${target.top},width=${target.width},height=${target.height}`;
}

/**
 * Moves an already-open second-screen window onto its target screen, for the
 * open that could not place it at {@code window.open} time (see
 * {@link openSecondScreenWindow}). Placing a window on another screen needs the
 * window-management permission, which is exactly what the caller has just
 * awaited.
 *
 * @param {Window} win - The window to place.
 * @param {ScreenDetails} details - The screen details.
 * @param {number} screenId - Optional target screen index.
 * @returns {void}
 */
function placeSecondScreenWindow(win: Window, details: ScreenDetails, screenId?: number) {
    const target = getTargetScreen(details, screenId);

    win.moveTo(target.left, target.top);
    win.resizeTo(target.width, target.height);
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
 * Handles the user closing a second-screen window while it is still being set
 * up, i.e. before it has a handle for {@link handleWindowClosed} to work from.
 * Closing it then is the same action as closing it a moment later, so it reports
 * the same event rather than an error, and there is no window left to close.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {string} phase - What the open was waiting on, for the log line.
 * @returns {void}
 */
function handleWindowClosedWhileOpening(store: IStore, id: string, phase: string) {
    logger.debug(`Second-screen window "${id}" was closed while ${phase}`);
    store.dispatch(removeSecondScreen(id));
    APP.API?.notifySecondScreenClosed?.({ id });
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

    // Detach the handle before removing the entry, so the middleware's REMOVE
    // handler finds none and the removal stays silent: a failed open reports
    // secondScreenError alone, as it does on master, and never a
    // secondScreenClosed on top of it. Only the window-management denial reaches
    // here with a handle in state, since that is the one failure that now comes
    // after the window was registered, but the detach covers any later one too.
    // An embedder that reopens on secondScreenClosed would otherwise loop on it.
    // Detaching first also unmounts the portal while the window is still open,
    // which is the ordering the REMOVE handler documents. Nothing awaits between
    // the two dispatches, so no cancel or resend can observe the entry without
    // its handle.
    if (getHandle(store.getState(), id)) {
        store.dispatch(setSecondScreenWindow(id, undefined));
    }

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
    // failure usually applies to both requests anyway. This spans the page load
    // and nothing else: the window-management permission is answered after the
    // handle is in state, by a tail that holds no guard (see
    // {@link openSecondScreenWindow}), so a request arriving during a prompt
    // finds a live handle above and re-sources it. A screenId that changed in the
    // meantime is ignored, exactly as it is for a window that is already open.
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
 * Fullscreens a second-screen window. Needs the AutomaticFullscreen permission on
 * a managed device; without it the window simply stays windowed, which is why a
 * refusal is logged rather than failing the open.
 *
 * @param {Window} win - The window to fullscreen.
 * @param {string} id - The window id, for the log line.
 * @returns {Promise<void>}
 */
async function fullscreenSecondScreen(win: Window, id: string): Promise<void> {
    try {
        await win.document.documentElement.requestFullscreen();
    } catch (e) {
        logger.debug(`Auto-fullscreen not granted for second screen "${id}"`, e);
    }
}

/**
 * Places and fullscreens a window once the window-management permission has been
 * answered, for the open that could not place it at {@code window.open} time. Runs
 * after the window is already registered and rendering, so everything it touches
 * has to be re-checked: the answer can arrive long after the open finished, and
 * the meeting has been free to close the window or open another for the same id
 * in the meantime.
 *
 * Ownership is compared by handle identity rather than by asking whether an entry
 * exists, so a window that was closed and opened again for the same id is neither
 * placed nor torn down by the open it replaced.
 *
 * A denial (or a prompt left unanswered past {@link SECOND_SCREEN_PERMISSION_TIMEOUT})
 * fails the open as it does everywhere else: without the permission the window
 * cannot be put on another screen, which is the point of the feature, so it is
 * closed and reported rather than left on the meeting's own display.
 *
 * @param {IStore} store - The redux store.
 * @param {string} id - The window id.
 * @param {ISecondScreenHandle} handle - The handle this open registered.
 * @param {Promise<ScreenDetails>} pending - The in-flight permission request.
 * @param {number} screenId - Optional target screen index.
 * @returns {Promise<void>}
 */
async function placeSecondScreenWhenPermitted(
        store: IStore,
        id: string,
        handle: ISecondScreenHandle,
        pending: Promise<ScreenDetails>,
        screenId?: number): Promise<void> {
    let error: unknown;
    const resolved = await pending.then(details => details, e => {
        error = e;

        return undefined;
    });

    if (getHandle(store.getState(), id) !== handle || handle.win.closed) {
        logger.debug(`Dropping the window-management answer for second screen "${id}": `
            + 'it no longer owns that window');

        return;
    }

    if (!resolved) {
        logger.warn(`Window Management API unavailable; cannot place second-screen window "${id}"`, error);
        failSecondScreenOpen(store, id, 'window-management-unavailable', handle.win);

        return;
    }

    placeSecondScreenWindow(handle.win, resolved, screenId);
    await fullscreenSecondScreen(handle.win, id);
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

    const details = screenDetails;
    const url = getSecondScreenPageUrl(store.getState());

    // Nothing above this awaits, so window.open runs in the task that dispatched
    // and a window opened from a click still counts as user-initiated to the
    // popup blocker. With the details cached the window is placed as it opens,
    // which is every open but the first. Without them, obtaining them here first
    // would put the window-management permission prompt between the click and
    // the open: Chromium expires transient user activation after 5s while the
    // prompt sits until it is answered, so a user who reads it before pressing
    // Allow would have their window blocked rather than opened. Open unplaced
    // instead and move it once the answer arrives.
    const win = window.open(url, `jitsiSecondScreen_${id}`, details ? computeFeatures(details, screenId) : 'popup');

    if (!win) {
        logger.warn(`Failed to open second-screen window "${id}" (popup blocked?)`);
        failSecondScreenOpen(store, id, 'popup-blocked');

        return;
    }

    // Start the request now so it runs alongside the page load rather than after
    // it. Its outcome is handled once there is a handle to hang it on; this only
    // keeps a rejection that arrives first from counting as unhandled.
    const pendingDetails = details ? undefined : awaitScreenDetails(loadScreenDetails());

    pendingDetails?.catch(() => undefined);

    // Wait for the shell page to replace the popup's initial empty document
    // before building the handle on it.
    const result = win.closed ? 'closed' : await awaitSecondScreenLoad(win);

    if (result === 'closed' || win.closed) {
        handleWindowClosedWhileOpening(store, id, 'loading');

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

    // From here the window has the ordinary lifecycle rather than a half-open one:
    // a cancel, a source leaving the meeting, or the conference ending all close
    // it through closeSecondScreenHandle and report secondScreenClosed, and a
    // repeat send finds a live handle above and re-sources it. Registering only
    // after the permission was answered is what left all three of those with an
    // entry, no handle, and nothing reported.
    //
    // applySource runs here rather than behind placement. The window renders the
    // source from this point, so the event is true when it is sent, and holding
    // it back would not make "no event before placement" hold anyway: the
    // subscriber calls applySource for every entry that has a handle, so a live
    // role that resolves to someone else while the prompt is up emits it
    // regardless. Deferring would only make the first event intermittent, and
    // would drop it altogether where placement throws on a window that is live
    // and rendering.
    applySource(store, id);

    if (!pendingDetails) {
        await fullscreenSecondScreen(win, id);

        return;
    }

    // Placement waits on the permission, so it becomes a tail rather than part of
    // the open. Deliberately not awaited: holding the in-flight guard until a user
    // answers a prompt is exactly what made a cancel silent. Fullscreen goes with
    // it, and only after placement, or the window would fill the meeting's own
    // screen for as long as the prompt is up.
    // Caught here rather than by handleSecondScreenOpenError: the tail outlives the
    // open, so it is no longer inside that catch-all. The window is live and
    // registered by this point, so a throw costs it its placement, not its
    // existence, and the meeting can still close it.
    placeSecondScreenWhenPermitted(store, id, handle, pendingDetails, screenId)
        .catch(e => logger.warn(`Could not place second-screen window "${id}" after the permission answer`, e));
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
 * Re-resolves and re-renders every open second-screen window, and closes the
 * in-app ones whose source has left the meeting. Called by the subscriber when
 * the active speaker / tracks change.
 *
 * Only the in-app windows are closed: an embedder's window is the embedder's to
 * manage, it is told what happened through {@code secondScreenSourceChanged} and
 * the ordinary participant events, and closing it from here would change the
 * external API's behaviour for input it already accepts today.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
export function refreshSecondScreens(store: IStore) {
    Object.keys(store.getState()['features/multi-screen'].screens).forEach(id => {
        const state = store.getState();
        const handle = getHandle(state, id);
        const entry = state['features/multi-screen'].screens[id];

        if (handle?.win.closed) {
            handleWindowClosed(store, id);
        } else if (entry && id.startsWith(UI_SECOND_SCREEN_ID_PREFIX) && isSecondScreenSourceGone(state, entry.source)) {

            // Closes the window and reports secondScreenClosed, the same as the
            // trigger the user no longer has. An entry whose window is still
            // opening is left with none, which that open already handles.
            logger.debug(`Closing second screen "${id}": its source is no longer in the meeting`);
            store.dispatch(removeSecondScreen(id));
        } else if (handle) {
            applySource(store, id);
        }
    });
}
