import { IReduxState } from '../app/types';

import { SECONDARY_LAYOUTS, SECONDARY_WINDOW_FALLBACK, SecondaryLayout } from './constants';
import logger from './logger';

/**
 * The on-screen placement (position and size, in pixels) of the secondary
 * multi-screen window.
 */
export interface ISecondaryWindowPlacement {

    /**
     * The height of the window.
     */
    height: number;

    /**
     * The distance from the left edge of the (virtual) screen.
     */
    left: number;

    /**
     * The distance from the top edge of the (virtual) screen.
     */
    top: number;

    /**
     * The width of the window.
     */
    width: number;
}

/**
 * The result of resolving a secondary-window placement: the geometry plus flags
 * for why it may have fallen back (permission denied, or window management
 * unavailable) so the caller can surface that to the user.
 */
export interface ISecondaryWindowPlacementResult {

    /**
     * Whether window-management permission was denied, causing placement to
     * fall back instead of targeting a specific monitor.
     */
    permissionDenied: boolean;

    /**
     * The computed window geometry.
     */
    placement: ISecondaryWindowPlacement;

    /**
     * Whether the Window Management API is unavailable in this browser (e.g.
     * Firefox/Safari), so the window opened at a fallback offset the user may
     * need to drag to another screen rather than being placed there
     * automatically.
     */
    windowManagementUnavailable: boolean;
}

/**
 * Returns whether multi-screen is available and enabled.
 *
 * The feature is experimental, so it is opt-in: it is enabled only when
 * {@code config.multiScreen.enabled} is explicitly {@code true}. Beyond that it
 * only needs {@code window.open()} to work; the Window Management API
 * ({@code getScreenDetails}) is used for smart multi-monitor placement when
 * present (Chrome/Edge 100+) and otherwise the window opens at a fallback offset
 * the user can drag to another screen. Gating on {@code window.open} (rather than
 * the placement API) keeps that fallback path reachable on Firefox/Safari.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean} Whether multi-screen is supported and enabled.
 */
export function isMultiScreenSupported(state: IReduxState): boolean {
    return typeof window !== 'undefined'
        && typeof window.open === 'function'
        && state['features/base/config'].multiScreen?.enabled === true;
}

/**
 * Returns whether the secondary multi-screen window is currently active.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean} Whether multi-screen is active.
 */
export function isMultiScreenActive(state: IReduxState): boolean {
    return state['features/multi-screen'].isActive;
}

/**
 * Returns the current layout mode of the secondary window.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {SecondaryLayout} The current secondary layout.
 */
export function getSecondaryLayout(state: IReduxState): SecondaryLayout {
    return state['features/multi-screen'].secondaryLayout;
}

/**
 * Type guard for whether a string is one of the known secondary layouts.
 *
 * @param {string} [value] - The candidate layout value.
 * @returns {boolean} Whether it is a valid {@link SecondaryLayout}.
 */
function isValidLayout(value?: string): value is SecondaryLayout {
    return (Object.values(SECONDARY_LAYOUTS) as string[]).includes(value ?? '');
}

/**
 * Returns the secondary layout the window should open with, as configured by the
 * deployment via {@code config.multiScreen.defaultLayout}, or {@code undefined}
 * when nothing valid is configured (in which case the user preference or reducer
 * default applies).
 *
 * The configured value is validated against {@link SECONDARY_LAYOUTS} so an
 * unrecognised string in config can't put the secondary window into an invalid
 * layout.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {SecondaryLayout|undefined} The configured default layout, if valid.
 */
export function getConfiguredDefaultLayout(state: IReduxState): SecondaryLayout | undefined {
    const configured = state['features/base/config'].multiScreen?.defaultLayout;

    return isValidLayout(configured) ? configured : undefined;
}

/**
 * Resolves the layout the secondary window should open in, in priority order:
 * the user's last-used layout (persisted in {@code base/settings}), then the
 * deployment-configured default, then the gallery fallback. Each candidate is
 * validated against {@link SECONDARY_LAYOUTS}.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {SecondaryLayout} The layout to open with.
 */
export function getEffectiveSecondaryLayout(state: IReduxState): SecondaryLayout {
    const saved = state['features/base/settings'].multiScreenLayout;

    if (isValidLayout(saved)) {
        return saved;
    }

    return getConfiguredDefaultLayout(state) ?? SECONDARY_LAYOUTS.GALLERY;
}

/**
 * Computes the gallery grid dimensions (columns and rows) for a given number of
 * participants, using a Jitsi-style heuristic:
 * {@code columns = min(ceil(sqrt(n)), maxColumns, n)}.
 *
 * Kept pure and side-effect free so it can be unit-tested in isolation.
 *
 * @param {number} numberOfParticipants - The number of participants to lay out.
 * @param {number} maxColumns - The maximum number of columns allowed.
 * @returns {Object} The grid dimensions, as { columns, rows }.
 */
export function getGalleryGridDimensions(
        numberOfParticipants: number,
        maxColumns: number
): { columns: number; rows: number; } {
    if (numberOfParticipants <= 0) {
        return { columns: 1,
            rows: 1 };
    }

    const columns = Math.min(
        Math.ceil(Math.sqrt(numberOfParticipants)),
        maxColumns,
        numberOfParticipants
    );
    const rows = Math.ceil(numberOfParticipants / columns);

    return { columns,
        rows };
}

/**
 * Computes the placement (position and size) for the secondary multi-screen
 * window.
 *
 * Uses the Window Management API (getScreenDetails) to detect connected
 * monitors and, when more than one is present, fills whichever screen the main
 * meeting window is not currently on. When only a single screen is available —
 * or the API is unsupported or its permission is denied — it falls back to an
 * offset window sized relative to the available screen real estate (see
 * {@link SECONDARY_WINDOW_FALLBACK}).
 *
 * @returns {Promise<ISecondaryWindowPlacementResult>} The placement geometry,
 * whether window-management permission was denied, and whether the window had to
 * fall back to an offset (because the API is unavailable or otherwise failed).
 */
export async function getSecondaryWindowPlacement(): Promise<ISecondaryWindowPlacementResult> {
    const placement = getFallbackPlacement();

    if (typeof window === 'undefined' || !('getScreenDetails' in window)) {
        return { permissionDenied: false, placement, windowManagementUnavailable: true };
    }

    try {
        const { currentScreen, screens } = await window.getScreenDetails();

        if (screens.length <= 1) {
            logger.info('Only one screen detected, using offset position');

            return { permissionDenied: false, placement, windowManagementUnavailable: false };
        }

        // Fill whichever screen the main meeting window is NOT currently on, so
        // the secondary always lands on the other monitor regardless of which
        // display the meeting occupies. Screens are matched by their position in
        // the virtual desktop (object identity is not guaranteed across the API);
        // fall back to a non-primary screen, then to any other screen.
        const isSameScreen = (a: ScreenDetailed, b: ScreenDetailed) => a.left === b.left && a.top === b.top;
        const secondary = screens.find(s => !isSameScreen(s, currentScreen))
            ?? screens.find(s => !s.isPrimary)
            ?? screens[1];
        const targeted: ISecondaryWindowPlacement = {
            height: secondary.availHeight,
            left: secondary.availLeft,
            top: secondary.availTop,
            width: secondary.availWidth
        };

        logger.info(`Targeting secondary screen: ${targeted.width}x${targeted.height} `
            + `at (${targeted.left}, ${targeted.top})`);

        return { permissionDenied: false, placement: targeted, windowManagementUnavailable: false };
    } catch (error) {
        // getScreenDetails rejects with a NotAllowedError DOMException when the
        // window-management permission is denied; distinguish that so the caller
        // can prompt the user. Any other failure (SecurityError in a restricted
        // iframe, NotSupportedError, transient errors) also leaves the window at
        // the fallback offset, so flag it as unavailable too — otherwise the
        // caller would surface nothing and the user wouldn't know to drag it.
        const permissionDenied = error instanceof DOMException && error.name === 'NotAllowedError';

        logger.warn('Window Management API failed, using fallback position', error);

        return { permissionDenied, placement, windowManagementUnavailable: !permissionDenied };
    }
}

/**
 * Builds the fallback placement used when the secondary window cannot be
 * targeted to a specific monitor. The window is sized to a fraction of the
 * available screen real estate, degrading to fixed dimensions when the screen
 * metrics cannot be read.
 *
 * @returns {ISecondaryWindowPlacement} The fallback window placement geometry.
 */
function getFallbackPlacement(): ISecondaryWindowPlacement {
    const { HEIGHT, LEFT, SIZE_RATIO, TOP, WIDTH } = SECONDARY_WINDOW_FALLBACK;
    const availWidth = typeof window === 'undefined' ? 0 : window.screen.availWidth;
    const availHeight = typeof window === 'undefined' ? 0 : window.screen.availHeight;

    return {
        height: Math.round(availHeight * SIZE_RATIO) || HEIGHT,
        left: LEFT,
        top: TOP,
        width: Math.round(availWidth * SIZE_RATIO) || WIDTH
    };
}
