/**
 * Constants for the `Transport`-based protocol between the Jitsi Meet conference
 * and the advisor app rendered inside the custom panel, on both web (iframe) and
 * native (WebView).
 *
 * Both platforms run the same `Transport` from `@jitsi/js-utils`, so the envelope
 * is identical on the wire.
 *
 * ```
 * { type: 'event', data: { name: EVENT_CLOSE_PANEL } }
 * ```
 *
 * Only the pipe underneath differs, and with it where the scope travels.
 *
 * - Web uses `MessageChannelTransportBackend`. The advisor creates the channel and
 *   posts `init_channel` to `window.parent`, which is validated once by origin and
 *   scope. Messages then flow bare over the adopted `MessagePort`.
 * - Native uses `ReactNativeWebViewTransportBackend`. A `MessagePort` cannot cross
 *   the react-native-webview bridge, so there is no handshake and the scope rides
 *   on every message instead, serialized with `JSON.stringify` and sent through
 *   `window.ReactNativeWebView.postMessage` from the advisor side.
 *
 * ```
 * { scope: API_SCOPE, type: 'event', data: { name: EVENT_CLOSE_PANEL } }
 * ```
 */

/**
 * Scope identifier used to namespace the protocol between the conference and the
 * advisor app. On web it is validated during the `init_channel` handshake. On
 * native it is a field on every bridge message, since the bridge has no handshake.
 *
 * It is a shared contract: the advisor app must use the same value, or web's
 * handshake never completes and native drops every message, both silently.
 */
export const API_SCOPE = 'jitsi_custom_panel';

/**
 * Event name used by the advisor app to ask the meeting to close the custom
 * panel. Dispatched as an `{ name: EVENT_CLOSE_PANEL }` envelope via
 * `transport.sendEvent(...)` on both platforms.
 */
export const EVENT_CLOSE_PANEL = 'close-panel';
