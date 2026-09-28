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

/**
 * Namespaces the advisor protocol. The advisor must use the same value, or every message is
 * silently dropped. Web checks it once in the handshake; native sends it on every message.
 */
export const API_SCOPE = 'jitsi_custom_panel';

/**
 * Event the advisor sends to close the panel.
 */
export const EVENT_CLOSE_PANEL = 'close-panel';
