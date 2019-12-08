import Postis from 'postis';

/**
 * The default options for postis.
 *
 * @type {Object}
 */
const DEFAULT_POSTIS_OPTIONS = {
    window: window.opener || window.parent
};

/**
 * The postis method used for all messages.
 *
 * @type {string}
 */
const POSTIS_METHOD_NAME = 'message';

/**
 * Implements message transport using the postMessage API.
 */
export default class PostMessageTransportBackend {
    /**
     * Creates new PostMessageTransportBackend instance.
     *
     * @param {Object} options - Optional parameters for configuration of the
     * transport.
     */
    constructor({ postisOptions } = {}) {
        // eslint-disable-next-line new-cap
        this.postis = Postis({
            ...DEFAULT_POSTIS_OPTIONS,
            ...postisOptions
        });

        this._receiveCallback = () => {
            // Do nothing until a callback is set by the consumer of
            // PostMessageTransportBackend via setReceiveCallback.
        };

        this.postis.listen(
            POSTIS_METHOD_NAME,
            message => this._receiveCallback(message));
    }

    /**
     * Disposes the allocated resources.
     *
     * @returns {void}
     */
    dispose() {
        this.postis.destroy();
    }

    /**
     * Sends the passed message.
     *
     * @param {Object} message - The message to be sent.
     * @returns {void}
     */
    send(message) {
        this.postis.send({
            method: POSTIS_METHOD_NAME,
            params: message
        });
    }

    /**
     * Sets the callback for receiving data.
     *
     * @param {Function} callback - The new callback.
     * @returns {void}
     */
    setReceiveCallback(callback) {
        this._receiveCallback = callback;
    }
}
