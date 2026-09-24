/**
 * Default WIDTH for the Document Picture-in-Picture window.
 */
export const DEFAULT_DOCUMENT_PIP_WIDTH = 284;

/**
 * Default HEIGHT for the Document Picture-in-Picture window.
 */
export const DEFAULT_DOCUMENT_PIP_HEIGHT = 160;

/**
 * The window.open() frame name identifying the custom Electron PiP window.
 * The Electron SDK's main process recognizes this name and turns the popup
 * into a small frameless always-on-top window; must stay in sync with
 * PIP_WINDOW_NAME in jitsi-meet-electron-sdk.
 */
export const ELECTRON_PIP_WINDOW_NAME = 'JitsiMeetPiPWindow';

/**
 * Default WIDTH for the custom Electron PiP window; matches the legacy
 * always-on-top window size.
 */
export const DEFAULT_ELECTRON_PIP_WIDTH = 320;

/**
 * Default HEIGHT for the custom Electron PiP window; matches the legacy
 * always-on-top window size.
 */
export const DEFAULT_ELECTRON_PIP_HEIGHT = 180;

/**
 * How long after opening the custom Electron PiP window a premature close is
 * interpreted as "the embedding app denied the popup" (no SDK support) rather
 * than as the user dismissing the window.
 */
export const ELECTRON_PIP_DENIAL_GRACE_MS = 1000;

/**
 * Electron-only delay before reacting to window focus, so that the browser's
 * leavepictureinpicture event is processed first (see PiPVideoElement for the
 * full explanation of the underlying browser quirk).
 */
export const FOCUS_CHECK_DELAY_MS = 100;
