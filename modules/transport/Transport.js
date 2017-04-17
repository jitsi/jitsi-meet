import {
    MESSAGE_TYPE_EVENT,
    MESSAGE_TYPE_RESPONSE,
    MESSAGE_TYPE_REQUEST
} from './constants';

/**
 * Stores the currnet transport that have to be used.
 */
export default class Transport {
    /**
     * Creates new instance.
     *
     * @param {Object} options - Optional parameters for configuration of the
     * transport.
     */
    constructor(options = {}) {
        const { transport } = options;

        this._requestID = 0;

        this._responseHandlers = new Map();

        this._listeners = new Map();

        this._unprocessedMessages = new Set();

        this.addListener = this.on;

        if (transport) {
            this.setTransport(transport);
        }
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
     * @param {Object} data - The data.
     * @returns {void}
     */
    _onDataReceived(data) {
        if (data.type === MESSAGE_TYPE_RESPONSE) {
            const handler = this._responseHandlers.get(data.id);

            if (handler) {
                handler(data);
                this._responseHandlers.delete(data.id);
            }

            return;
        }

        if (data.type === MESSAGE_TYPE_REQUEST) {
            this.emit('request', data.data, (result, error) => {
                this._transport.send({
                    type: MESSAGE_TYPE_RESPONSE,
                    result,
                    error,
                    id: data.id
                });
            });
        } else {
            this.emit('event', data.data);
        }
    }

    /**
     * Disposes the allocated resources.
     *
     * @returns {void}
     */
    dispose() {
        this._responseHandlers.clear();
        this._unprocessedMessages.clear();
        this.removeAllListeners();
        this._disposeTransport();
    }

    /**
     * Calls each of the listeners registered for the event named eventName, in
     * the order they were registered, passing the supplied arguments to each.
     *
     * @param {string} eventName -  The name of the event.
     * @returns {boolean} True if the event had listeners, false otherwise.
     */
    emit(eventName, ...args) {
        const listenersForEvent = this._listeners.get(eventName);

        if (!listenersForEvent || listenersForEvent.size === 0) {
            this._unprocessedMessages.add(args);

            return false;
        }

        let isProcessed = false;

        listenersForEvent.forEach(listener => {
            isProcessed = listener(...args) || isProcessed;
        });

        if (!isProcessed) {
            this._unprocessedMessages.add(args);
        }
    }

    /**
     * Adds the listener function to the listeners collection for the event
     * named eventName.
     *
     * @param {string} eventName -  The name of the event.
     * @param {Function} listener - The listener that will be added.
     * @returns {Transport} References to the instance of Transport class, so
     * that calls can be chained.
     */
    on(eventName, listener) {
        let listenersForEvent = this._listeners.get(eventName);

        if (!listenersForEvent) {
            listenersForEvent = new Set();
            this._listeners.set(eventName, listenersForEvent);
        }

        listenersForEvent.add(listener);

        this._unprocessedMessages.forEach(args => {
            if (listener(...args)) {
                this._unprocessedMessages.delete(args);
            }
        });

        return this;
    }

    /**
     * Removes all listeners, or those of the specified eventName.
     *
     * @param {string} [eventName] -  The name of the event.
     * @returns {Transport} References to the instance of Transport class, so
     * that calls can be chained.
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this._listeners.delete(eventName);
        } else {
            this._listeners.clear();
        }

        return this;
    }

    /**
     * Removes the listener function from the listeners collection for the event
     * named eventName.
     *
     * @param {string} eventName -  The name of the event.
     * @param {Function} listener - The listener that will be removed.
     * @returns {Transport} References to the instance of Transport class, so
     * that calls can be chained.
     */
    removeListener(eventName, listener) {
        const listenersForEvent = this._listeners.get(eventName);

        if (listenersForEvent) {
            listenersForEvent.delete(listener);
        }

        return this;
    }

    /**
     * Sends the passed data.
     *
     * @param {Object} data - The data to be sent.
     * @returns {void}
     */
    sendEvent(data = {}) {
        if (this._transport) {
            this._transport.send({
                type: MESSAGE_TYPE_EVENT,
                data
            });
        }
    }

    /**
     * Sending request.
     *
     * @param {Object} data - The data for the request.
     * @returns {Promise}
     */
    sendRequest(data) {
        if (!this._transport) {
            return Promise.reject(new Error('No transport defined!'));
        }
        this._requestID++;
        const id = this._requestID;

        return new Promise((resolve, reject) => {
            this._responseHandlers.set(this._requestID, response => {
                const { result, error } = response;

                if (result) {
                    resolve(result);
                } else if (error) {
                    reject(error);
                } else { // no response
                    reject(new Error('Unexpected response format!'));
                }
            });

            this._transport.send({
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
        this._transport.setDataReceivedCallback(
            this._onDataReceived.bind(this));
    }
}
