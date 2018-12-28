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
 * The list of methods of incoming postis messages that we have to support for
 * backward compatibility for the users that are directly sending messages to
 * Jitsi Meet (without using external_api.js)
 *
 * @type {string[]}
 */
const LEGACY_INCOMING_METHODS = [
    'avatar-url',
    'display-name',
    'email',
    'toggle-audio',
    'toggle-chat',
    'toggle-film-strip',
    'toggle-share-screen',
    'toggle-video',
    'video-hangup'
];

/**
 * The list of methods of outgoing postis messages that we have to support for
 * backward compatibility for the users that are directly listening to the
 * postis messages send by Jitsi Meet(without using external_api.js).
 *
 * @type {string[]}
 */
const LEGACY_OUTGOING_METHODS = [
    'display-name-change',
    'incoming-message',
    'outgoing-message',
    'participant-joined',
    'participant-left',
    'video-conference-joined',
    'video-conference-left',
    'video-ready-to-close'
];

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
    constructor({ enableLegacyFormat, postisOptions } = {}) {
        // eslint-disable-next-line new-cap
        this.postis = Postis({
            ...DEFAULT_POSTIS_OPTIONS,
            ...postisOptions
        });

        /**
         * If true PostMessageTransportBackend will process and send messages
         * using the legacy format and in the same time the current format.
         * Otherwise all messages (outgoing and incoming) that are using the
         * legacy format will be ignored.
         *
         * @type {boolean}
         */
        this._enableLegacyFormat = enableLegacyFormat;

        if (this._enableLegacyFormat) {
            // backward compatibility
            LEGACY_INCOMING_METHODS.forEach(method =>
                this.postis.listen(
                    method,
                    params =>
                        this._legacyMessageReceivedCallback(method, params)
                )
            );
        }

        this._receiveCallback = () => {
            // Do nothing until a callback is set by the consumer of
            // PostMessageTransportBackend via setReceiveCallback.
        };

        this.postis.listen(
            POSTIS_METHOD_NAME,
            message => this._receiveCallback(message));
    }

    /**
     * Handles incoming legacy postis messages.
     *
     * @param {string} method - The method property from the postis message.
     * @param {Any} params - The params property from the postis message.
     * @returns {void}
     */
    _legacyMessageReceivedCallback(method, params = {}) {
        this._receiveCallback({
            data: {
                name: method,
                data: params
            }
        });
    }

    /**
     * Sends the passed message via postis using the old format.
     *
     * @param {Object} legacyMessage - The message to be sent.
     * @returns {void}
     */
    _sendLegacyMessage({ name, ...data }) {
        if (name && LEGACY_OUTGOING_METHODS.indexOf(name) !== -1) {
            this.postis.send({
                method: name,
                params: data
            });
        }
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

        if (this._enableLegacyFormat) {
            // For the legacy use case we don't need any new fields defined in
            // Transport class. That's why we are passing only the original
            // object passed by the consumer of the Transport class which is
            // message.data.
            this._sendLegacyMessage(message.data || {});
        }
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
