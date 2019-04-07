import { NativeModules } from 'react-native';

const { Amplitude: AmplitudeNative } = NativeModules;

/**
 * Wrapper for the Amplitude native module.
 */
class Amplitude {
    /**
     * Create new Amplitude instance.
     *
     * @param {string} instanceName - The name of the Amplitude instance. Should
     * be used only for multi-project logging.
     */
    constructor(instanceName) {
        this._instanceName = instanceName;
    }

    /**
     * Initializes the Amplitude SDK.
     *
     * @param {string} apiKey - The API_KEY of the Amplitude project.
     * @returns {void}
     */
    init(apiKey) {
        AmplitudeNative.init(this._instanceName, apiKey);
    }

    /**
     * Sets user properties for the current user.
     *
     * @param {Object} userProperties - The user properties to be set.
     * @returns {void}
     */
    setUserProperties(userProperties) {
        AmplitudeNative.setUserProperties(this._instanceName, userProperties);
    }

    /**
     * Log an event with eventType and eventProperties.
     *
     * @param {string} eventType - The type of the event.
     * @param {Object} eventProperties - The properties of the event.
     * @returns {void}
     */
    logEvent(eventType, eventProperties) {
        // The event properties are converted to JSON string because of known
        // performance issue when passing objects trough the RN bridge too
        // often (a few times a second).
        AmplitudeNative.logEvent(
            this._instanceName, eventType, JSON.stringify(eventProperties));
    }

}

/**
 * Cache of <tt>Amplitude</tt> instances by instanceName.
 */
const instances = {};

/**
 * The default (with instanceName - undefined) <tt>Amplitude</tt> instance.
 */
let defaultInstance;

export default {
    /**
     * Returns a <tt>Amplitude</tt> instance.
     *
     * @param {Object} options - Optional parameters.
     * @param {string} options.host - The host property from the current URL.
     * @param {string|undefined} options.instanceName - The name of the
     * amplitude instance. Should be used only for multi-project logging.
     * @returns {Amplitude}
     */
    getInstance(options = {}) {
        let instance;

        const { host = '', instanceName = '' } = options;

        let internalInstanceName = host;

        if (instanceName !== '') {
            internalInstanceName += `-${instanceName}`;
        }

        if (internalInstanceName === '') {
            instance = defaultInstance = defaultInstance || new Amplitude();
        } else {
            instance = instances[internalInstanceName]
                = instances[internalInstanceName]
                    || new Amplitude(internalInstanceName);
        }

        return instance;
    }
};
