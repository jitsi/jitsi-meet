/**
 * Default theme for the custom panel.
 */
export const DEFAULT_CUSTOM_PANEL_THEME = 'dark';

/**
 * Default width for the custom panel in pixels.
 */
export const DEFAULT_CUSTOM_PANEL_WIDTH = 315;

/**
 * Visual width of the drag handle in pixels.
 */
export const CUSTOM_PANEL_DRAG_HANDLE_WIDTH = 9;

/**
 * Visual height of the drag handle in pixels.
 */
export const CUSTOM_PANEL_DRAG_HANDLE_HEIGHT = 100;

/**
 * Touch target size for the drag handle on touch devices.
 * Provides adequate hit area (44px) for comfortable tapping.
 */
export const CUSTOM_PANEL_TOUCH_HANDLE_SIZE = 44;

/**
 * Offset from the panel edge for positioning the drag handle.
 */
export const CUSTOM_PANEL_DRAG_HANDLE_OFFSET = 4;

/*
 * Advisor protocol (only written copy). `Transport` envelope on all platforms:
 *   { type: 'event', data: { name: EVENT_CLOSE_PANEL } }
 *
 * Web: advisor posts `init_channel` to `window.parent` (origin + scope checked once), then uses the `MessagePort`.
 * Native: no handshake; every message is JSON with `scope: API_SCOPE`. Advisor sends via
 * `window.ReactNativeWebView.postMessage`.
 *   - iOS: advisor receives on `window`.
 *   - Android: advisor receives on `document`.
 */

/**
 * Namespaces the advisor protocol.
 */
export const API_SCOPE = 'jitsi_custom_panel';

/**
 * Event the advisor sends to close the panel.
 */
export const EVENT_CLOSE_PANEL = 'close-panel';
