import EventEmitter from 'events';
import Postis from 'postis';

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
export default class PostMessageTransport extends EventEmitter {
    /**
     * Creates new PostMessageTransport instance.
     *
     * @param {Object} options - Optional parameters for configuration of the
     * transport.
     */
    constructor(options = {}) {
        super();
        const postisOptions = Object.assign({}, defaultPostisOptions, options);

        this.postis = Postis(postisOptions);

        // We need this because addListener in overriden
        this.on = this.addListener;
    }

    /**
     * Handles incomming data from the transport.
     *
     * @param {string} name - The name of the event or request related to the
     * data received.
     * @param {Object} data - The data.
     * @returns {void}
     */
    _onDataReceived(name, data = {}) {
        let modifiedData;

        if (data._systemData) {
            const dataCopy = Object.assign({}, data);
            const _systemData = dataCopy._systemData;

            delete dataCopy._systemData;
            modifiedData = Object.assign({}, _systemData, { data: dataCopy });
        } else { // backward compatability
            modifiedData = { data };
        }

        this.emit(name, modifiedData);
    }

    /**
     * Overrides {@link EventEmitter#addListener()} to also add listener to
     * postis.
     *
     * @inheritdoc
     * @override
     */
    addListener(type, listener) {
        super.addListener(type, listener);
        this.postis.listen(type, data => this._onDataReceived(type, data));
    }

    /**
     * Disposes the allocated resources.
     *
     * @returns {void}
     */
    dispose() {
        this.removeAllListeners();
        this.postis.destroy();
    }

    /**
     * Sends the passed data.
     *
     * @param {string} name - The name of the event, request or response
     * related to the data received.
     * @param {Object} data - The data to be sent.
     * @returns {void}
     */
    send(name, data) {
        const { id, type, result, error } = data;
        const _systemData = {
            id,
            type,
            result,
            error
        };
        const params = Object.assign({}, data.data, { _systemData });

        this.postis.send({
            method: name,
            params
        });
    }
}
