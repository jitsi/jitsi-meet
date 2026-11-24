import { WebViewMessageEvent } from 'react-native-webview';

import logger from './logger';

type MessageListener = (data: string) => void;

interface IMessageSource {
    onMessage: (event: WebViewMessageEvent) => void;
    subscribe: (listener: MessageListener) => () => void;
}

interface IOptions {

    /**
     * Messages with a different scope are dropped.
     */
    scope: string;

    /**
     * Posts a serialized message to the WebView.
     */
    send: (data: string) => void;

    /**
     * Subscribes to raw WebView messages. Returns the unsubscribe function.
     */
    subscribe: IMessageSource['subscribe'];
}

/**
 * Fans the WebView `onMessage` out to subscribers, so the prop keeps one identity across transport rebuilds.
 *
 * @returns {IMessageSource}
 */
export function createMessageSource(): IMessageSource {
    const listeners = new Set<MessageListener>();

    return {
        onMessage: event => {
            listeners.forEach(listener => listener(event.nativeEvent.data));
        },
        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        }
    };
}

/**
 * Transport backend for the advisor WebView, which cannot receive a `MessagePort`.
 * Every message carries the scope instead, as a namespace check, not an origin check.
 */
export default class ReactNativeWebViewTransportBackend {
    private _receiveCallback?: (message: any) => void;
    private readonly _scope: string;
    private readonly _send: (data: string) => void;
    private readonly _unsubscribe: () => void;

    /**
     * Creates a new instance and subscribes to WebView messages.
     *
     * @param {IOptions} options - The backend configuration.
     */
    constructor({ scope, send, subscribe }: IOptions) {
        this._scope = scope;
        this._send = send;
        this._unsubscribe = subscribe(data => this._onMessage(data));
    }

    /**
     * Passes a message from the WebView to the transport.
     *
     * @param {string} data - The raw message.
     * @returns {void}
     */
    private _onMessage(data: string) {
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
     * Sends a message to the advisor. The page gets it on `window` (iOS) or `document` (Android).
     *
     * @param {any} message - The message.
     * @returns {void}
     */
    send(message: any) {
        this._send(JSON.stringify({
            scope: this._scope,
            ...message
        }));
    }

    /**
     * Sets the callback for incoming messages.
     *
     * @param {Function} callback - The callback.
     * @returns {void}
     */
    setReceiveCallback(callback: (message: any) => void) {
        this._receiveCallback = callback;
    }

    /**
     * Unsubscribes, so a message the WebView sends while unmounting never reaches the transport.
     *
     * @returns {void}
     */
    dispose() {
        this._unsubscribe();
    }
}
