/**
 * Constants for the postMessage-based protocol between the Jitsi Meet
 * conference and the advisor app rendered inside the custom panel, on both
 * web (iframe) and native (WebView).
 */

/**
 * Scope identifier used to namespace the messaging protocol between the
 * conference and the advisor app. On web it is validated during the
 * `init_channel` handshake. On native it is a field on every bridge message,
 * since the WebView bridge has no handshake.
 */
export const API_SCOPE = 'jitsi_custom_panel';

/**
 * Event name used by the advisor app to ask the meeting to close the custom
 * panel. Dispatched as an `{ name: EVENT_CLOSE_PANEL }` envelope.
 */
export const EVENT_CLOSE_PANEL = 'close-panel';
