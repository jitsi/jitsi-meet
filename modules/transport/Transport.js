import EventEmitter from 'events';

import {
    MESSAGE_TYPE_EVENT,
    MESSAGE_TYPE_RESPONSE,
    MESSAGE_TYPE_REQUEST
} from './constants';
import PostMessageTransport from './PostMessageTransport';

/**
 * Stores the currnet transport that have to be used.
 */
export default class Transport extends EventEmitter {
    /**
     * Creates new instance.
     *
     * @param {Object} options - Optional parameters for configuration of the
     * transport.
     */
    constructor(options = {}) {
        super();

        const { defaultTransportOptions, noDefaultTransport, transport }
            = options;

        // We need this because addListener in overriden
        this.on = this.addListener;

        this._requestID = 0;

        if (transport) {
            this._transport = transport;
        } else if (!noDefaultTransport) {
            // Set the default transport.
            this._transport = new PostMessageTransport(defaultTransportOptions);
        }

        this._transportListeners = new Map();

        this.on('removeListener', eventName => {
            const listener = this._transportListeners.get(eventName);

            if (listener) {
                if (this._transport) {
                    this._transport.removeListener(eventName, listener);
                }
                this._transportListeners.delete(eventName);
            }
        });
    }

    /**
     * Disposes the current transport.
     *
     * @returns {void}
     */
    _disposeTransport() {
        if (this._transport) {
            this._transport.dispose();
            this._transport = null;
        }
    }

    /**
     * Handles incomming data from the transport.
     *
     * @param {string} name - The name of the event, request or response
     * related to the data received.
     * @param {Object} data - The data.
     * @returns {void}
     */
    _onDataReceived(name, data) {
        if (data.type === MESSAGE_TYPE_RESPONSE) {
            // will be handled in sendRequest method.
            return;
        }
        let callback;

        if (data.type === MESSAGE_TYPE_REQUEST) {
            callback = (result, error) => {
                this._transport.send(name, {
                    type: MESSAGE_TYPE_RESPONSE,
                    result,
                    error,
                    id: data.id
                });
            };
        } else {
            callback = () => {
                // no need to send response.
            };
        }
        this.emit(name, data.data, callback);
    }

    /**
     * Overrides {@link EventEmitter#addListener()} to also add listener to
     * the low level transport class.
     *
     * @inheritdoc
     * @override
     */
    addListener(eventName, listener) {
        super.addListener(eventName, listener);
        const transportListener = this._onDataReceived.bind(this, eventName);

        this._transportListeners.set(eventName, transportListener);
        if (this._transport) {
            this._transport.on(eventName, transportListener);
        }
    }

    /**
     * Disposes the current transport and removes all listeners.
     *
     * @returns {void}
     */
    dispose() {
        this.removeAllListeners();
        this._disposeTransport();
    }

    /**
     * Sends the passed data.
     *
     * @param {string} name - The name of the event.
     * @param {Object} data - The data to be sent.
     * @returns {void}
     */
    sendEvent(name, data = {}) {
        if (this._transport) {
            this._transport.send(name, {
                type: MESSAGE_TYPE_EVENT,
                data
            });
        }
    }

    /**
     * Sending request.
     *
     * @param {string} name - The name of the request.
     * @param {Object} data - The data for the request.
     * @returns {Promise}
     */
    sendRequest(name, data) {
        if (!this._transport) {
            return Promise.reject(new Error('No transport defined!'));
        }
        this._requestID++;
        const id = this._requestID;

        return new Promise((resolve, reject) => {
            const listener = response => {
                if (response.id === id
                    && response.type === MESSAGE_TYPE_RESPONSE) {
                    this._transport.removeListener(data.method, listener);
                    const { result, error } = response;

                    if (result) {
                        resolve(result);
                    } else if (error) {
                        reject(error);
                    } else { // no response
                        reject(new Error('Unexpected response format!'));
                    }
                }
            };

            this._transport.on(name, listener);
            this._transport.send(name, {
                id,
                type: MESSAGE_TYPE_REQUEST,
                data
            });
        });
    }

    /**
     * Changes the current transport.
     *
     * @param {Object} transport - The new transport that will be used.
     * @returns {void}
     */
    setTransport(transport) {
        this._disposeTransport();
        this._transport = transport;
        this._transportListeners.forEach((listener, eventName) => {
            this._transport.on(eventName, listener);
        });
    }
}
