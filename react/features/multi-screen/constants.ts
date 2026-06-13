/**
 * Layout modes available for the secondary window.
 *
 * These are intentionally separate from the main window's LAYOUTS
 * (in features/video-layout/constants.ts) so that each window
 * can independently choose its own layout.
 */
export const SECONDARY_LAYOUTS = {

    /**
     * Active speaker view — shows the dominant/speaking participant
     * in a large video display.
     */
    ACTIVE_SPEAKER: 'active-speaker',

    /**
     * Gallery view — shows all participants in a responsive grid.
     */
    GALLERY: 'gallery'
} as const;

export type SecondaryLayout = typeof SECONDARY_LAYOUTS[keyof typeof SECONDARY_LAYOUTS];

/**
 * The DOM id of the root element inside the secondary window into which the
 * SecondaryConference is rendered (via React portal).
 *
 * Shared between the action that creates the element and the portal component
 * that targets it, so the two cannot drift.
 */
export const SECONDARY_WINDOW_ROOT_ID = 'multi-screen-root';

/**
 * The window name (target) used when opening the secondary window.
 *
 * Reusing the same name means a repeated open() references the existing window
 * instead of spawning a duplicate.
 */
export const SECONDARY_WINDOW_NAME = 'jitsi-multi-screen';

/**
 * Fallback geometry for the secondary window, used when the Window Management
 * API is unavailable, permission is denied, or only a single screen is present.
 *
 * The window is offset from the top-left corner and sized to a fraction of the
 * available screen real estate so it scales with the display (e.g. 960×540 on a
 * 1080p screen). The fixed WIDTH/HEIGHT are used only when the `screen` metrics
 * cannot be read.
 */
export const SECONDARY_WINDOW_FALLBACK = {

    /**
     * Horizontal offset, in pixels, from the left edge of the primary screen.
     */
    LEFT: 100,

    /**
     * Vertical offset, in pixels, from the top edge of the primary screen.
     */
    TOP: 100,

    /**
     * Fraction of the available screen size used for the window dimensions.
     */
    SIZE_RATIO: 0.5,

    /**
     * Width, in pixels, used when screen metrics are unavailable.
     */
    WIDTH: 960,

    /**
     * Height, in pixels, used when screen metrics are unavailable.
     */
    HEIGHT: 540
} as const;
