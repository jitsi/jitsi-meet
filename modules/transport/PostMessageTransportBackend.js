import Postis from 'postis';

/**
 * The list of methods of incomming postis messages that we have to support for
 * backward compatability for the users that are directly sending messages to
 * Jitsi Meet (without using external_api.js)
 *
 * @type {string[]}
 */
const legacyIncomingMethods = [ 'display-name', 'toggle-audio', 'toggle-video',
    'toggle-film-strip', 'toggle-chat', 'toggle-contact-list',
    'toggle-share-screen', 'video-hangup', 'email', 'avatar-url' ];

/**
 * The list of methods of outgoing postis messages that we have to support for
 * backward compatability for the users that are directly listening to the
 * postis messages send by Jitsi Meet(without using external_api.js).
 *
 * @type {string[]}
 */
const legacyOutgoingMethods = [ 'display-name-change', 'incoming-message',
    'outgoing-message', 'participant-joined', 'participant-left',
    'video-ready-to-close', 'video-conference-joined',
    'video-conference-left' ];

/**
 * The postis method used for all messages.
 *
 * @type {string}
 */
const POSTIS_METHOD_NAME = 'data';

/**
 * The default options for postis.
 *
 * @type {Object}
 */
const defaultPostisOptions = {
    window: window.opener || window.parent
};

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
    constructor(options = {}) {
        const postisOptions = Object.assign({}, defaultPostisOptions, options);

        this.postis = Postis(postisOptions);

        // backward compatability
        legacyIncomingMethods.forEach(method =>
            this.postis.listen(method,
                params => this._onPostisDataReceived(method, params)));

        this.postis.listen(POSTIS_METHOD_NAME, data =>
            this._dataReceivedCallBack(data));

        this._dataReceivedCallBack = () => {
            // do nothing until real callback is set;
        };
    }

    /**
     * Handles incomming legacy postis data.
     *
     * @param {string} method - The method property from postis data object.
     * @param {Any} params - The params property from postis data object.
     * @returns {void}
     */
    _onPostisDataReceived(method, params = {}) {
        const newData = {
            data: {
                name: method,
                data: params
            }
        };

        this._dataReceivedCallBack(newData);
    }

    /**
     * Sends the passed data via postis using the old format.
     *
     * @param {Object} data - The data to be sent.
     * @returns {void}
     */
    _sendLegacyData(data) {
        const method = data.name;

        if (method && legacyOutgoingMethods.indexOf(method) !== -1) {
            this.postis.send({
                method,
                params: data.data
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
     * Sends the passed data.
     *
     * @param {Object} data - The data to be sent.
     * @returns {void}
     */
    send(data) {
        this.postis.send({
            method: POSTIS_METHOD_NAME,
            params: data
        });

        // For the legacy use case we don't need any new fields defined in
        // Transport class. That's why we are passing only the original object
        // passed by the consumer of the Transport class which is data.data.
        this._sendLegacyData(data.data);
    }

    /**
     * Sets the callback for receiving data.
     *
     * @param {Function} callback - The new callback.
     * @returns {void}
     */
    setDataReceivedCallback(callback) {
        this._dataReceivedCallBack = callback;
    }
}
