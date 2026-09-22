import logger from './logger';

interface IOptions {

    /**
     * Namespaces the protocol. Messages with a different scope are dropped.
     */
    scope: string;
}

/**
 * Carries the custom panel protocol over the react-native-webview bridge, which
 * cannot transfer a `MessagePort`. Every message carries the scope instead of a
 * one-time handshake. That is a namespace check, not an origin check.
 *
 * Receive-only: the owning hook feeds messages in through {@link onMessage}, and
 * {@link send} is a stub.
 */
export default class ReactNativeWebViewTransportBackend {
    private _disposed = false;
    private _receiveCallback?: (message: any) => void;
    private readonly _scope: string;

    /**
     * Creates a new instance.
     *
     * @param {IOptions} options - The backend configuration.
     */
    constructor({ scope }: IOptions) {
        this._scope = scope;
    }

    /**
     * Feeds a raw bridge message into the transport.
     *
     * @param {string} data - The raw string from the WebView.
     * @returns {void}
     */
    onMessage(data: string) {
        if (this._disposed) {
            return;
        }

        let payload: any;

        try {
            payload = JSON.parse(data);
        } catch (error) {
            logger.error('Failed to parse a message from the advisor', error);

            return;
        }

        if (payload?.scope !== this._scope) {
            return;
        }

        // `Transport` ignores the extra `scope` field.
        this._receiveCallback?.(payload);
    }

    /**
     * Required by `ITransportBackend`. The meeting sends nothing, so nothing reaches it.
     *
     * @param {any} message - The dropped message.
     * @returns {void}
     */
    send(message: any) {
        logger.error('The custom panel bridge is receive-only; dropped', message);
    }

    /**
     * Sets the callback that receives incoming messages.
     *
     * @param {Function} callback - The callback.
     * @returns {void}
     */
    setReceiveCallback(callback: (message: any) => void) {
        this._receiveCallback = callback;
    }

    /**
     * Disposes the backend. Later messages are dropped, because the WebView can still
     * deliver one while the screen unmounts.
     *
     * @returns {void}
     */
    dispose() {
        this._disposed = true;
        this._receiveCallback = undefined;
    }
}
