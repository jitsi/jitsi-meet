import {
    MESSAGE_TYPE_EVENT,
    MESSAGE_TYPE_REQUEST,
    MESSAGE_TYPE_RESPONSE
} from './constants';

/**
 * Stores the currnet transport backend that have to be used. Also implements
 * request/response mechanism.
 */
export default class Transport {
    /**
     * Creates new instance.
     *
     * @param {Object} options - Optional parameters for configuration of the
     * transport backend.
     */
    constructor({ backend } = {}) {
        /**
         * Maps an event name and listener that have been added to the Transport
         * instance.
         *
         * @type {Map<string, Function>}
         */
        this._listeners = new Map();

        /**
         * The request ID counter used for the id property of the request. This
         * property is used to match the responses with the request.
         *
         * @type {number}
         */
        this._requestID = 0;

        /**
         * Maps an IDs of the requests and handlers that will process the
         * responses of those requests.
         *
         * @type {Map<number, Function>}
         */
        this._responseHandlers = new Map();

        /**
         * A set with the events and requests that were received but not
         * processed by any listener. They are later passed on every new
         * listener until they are processed.
         *
         * @type {Set<Object>}
         */
        this._unprocessedMessages = new Set();

        /**
         * Alias.
         */
        this.addListener = this.on;

        if (backend) {
            this.setBackend(backend);
        }
    }

    /**
     * Disposes the current transport backend.
     *
     * @returns {void}
     */
    _disposeBackend() {
        if (this._backend) {
            this._backend.dispose();
            this._backend = null;
        }
    }

    /**
     * Handles incoming messages from the transport backend.
     *
     * @param {Object} message - The message.
     * @returns {void}
     */
    _onMessageReceived(message) {
        if (message.type === MESSAGE_TYPE_RESPONSE) {
            const handler = this._responseHandlers.get(message.id);

            if (handler) {
                handler(message);
                this._responseHandlers.delete(message.id);
            }
        } else if (message.type === MESSAGE_TYPE_REQUEST) {
            this.emit('request', message.data, (result, error) => {
                this._backend.send({
                    type: MESSAGE_TYPE_RESPONSE,
                    error,
                    id: message.id,
                    result
                });
            });
        } else {
            this.emit('event', message.data);
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
        this._disposeBackend();
    }

    /**
     * Calls each of the listeners registered for the event named eventName, in
     * the order they were registered, passing the supplied arguments to each.
     *
     * @param {string} eventName -  The name of the event.
     * @returns {boolean} True if the event has been processed by any listener,
     * false otherwise.
     */
    emit(eventName, ...args) {
        const listenersForEvent = this._listeners.get(eventName);
        let isProcessed = false;

        if (listenersForEvent && listenersForEvent.size) {
            listenersForEvent.forEach(listener => {
                isProcessed = listener(...args) || isProcessed;
            });
        }

        if (!isProcessed) {
            this._unprocessedMessages.add(args);
        }

        return isProcessed;
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
     * @param {string} [eventName] - The name of the event. If this parameter is
     * not specified all listeners will be removed.
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
     * Sends the passed event.
     *
     * @param {Object} event - The event to be sent.
     * @returns {void}
     */
    sendEvent(event = {}) {
        if (this._backend) {
            this._backend.send({
                type: MESSAGE_TYPE_EVENT,
                data: event
            });
        }
    }

    /**
     * Sending request.
     *
     * @param {Object} request - The request to be sent.
     * @returns {Promise}
     */
    sendRequest(request) {
        if (!this._backend) {
            return Promise.reject(new Error('No transport backend defined!'));
        }

        this._requestID++;

        const id = this._requestID;

        return new Promise((resolve, reject) => {
            this._responseHandlers.set(id, ({ error, result }) => {
                if (typeof result !== 'undefined') {
                    resolve(result);

                // eslint-disable-next-line no-negated-condition
                } else if (typeof error !== 'undefined') {
                    reject(error);
                } else { // no response
                    reject(new Error('Unexpected response format!'));
                }
            });

            this._backend.send({
                type: MESSAGE_TYPE_REQUEST,
                data: request,
                id
            });
        });
    }

    /**
     * Changes the current backend transport.
     *
     * @param {Object} backend - The new transport backend that will be used.
     * @returns {void}
     */
    setBackend(backend) {
        this._disposeBackend();

        this._backend = backend;
        this._backend.setReceiveCallback(this._onMessageReceived.bind(this));
    }
}
