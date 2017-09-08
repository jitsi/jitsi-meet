import {
    NativeModules,
    NativeEventEmitter,
    Platform
} from 'react-native';

const RNCallKit = NativeModules.RNCallKit;

/**
 * Thin wrapper around Apple's CallKit functionality.
 *
 * In CallKit requests are performed via actions (either user or system started)
 * and async events are reported via dedicated methods. This class exposes that
 * functionality in the form of methods and events. One important thing to note
 * is that even if an action is started by the system (because the user pressed
 * the "end call" button in the CallKit view, for example) the event will be
 * emitted in the same way as it would if the action originated from calling
 * the "endCall" method in this class, for example.
 *
 * Emitted events:
 *  - performAnswerCallAction: The user pressed the answer button.
 *  - performEndCallAction: The call should be ended.
 *  - performSetMutedCallAction: The call muted state should change. The
 *    ancillary `data` object contains a `muted` attribute.
 *  - providerDidReset: The system has reset, all calls should be terminated.
 *    This event gets no associated data.
 *
 * All events get a `data` object with a `callUUID` property, unless stated
 * otherwise.
 */
class CallKit extends NativeEventEmitter {
    /**
     * Initializes a new {@code CallKit} instance.
     */
    constructor() {
        super(RNCallKit);
        this._setup = false;
    }

    /**
     * Returns True if the current platform is supported, false otherwise. The
     * supported platforms are: iOS >= 10.
     *
     * @private
     * @returns {boolean}
     */
    static isSupported() {
        return Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 10;
    }

    /**
     * Checks if CallKit was setup, and throws an exception in that case.
     *
     * @private
     * @returns {void}
     */
    _checkSetup() {
        if (!this._setup) {
            throw new Error('CallKit not initialized, call setup() first.');
        }
    }

    /**
     * Adds a listener for the given event.
     *
     * @param {string} event - Name of the event we are interested in.
     * @param {Function} listener - Function which will be called when the
     * desired event is emitted.
     * @returns {void}
     */
    addEventListener(event, listener) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return;
        }

        this.addListener(event, listener);
    }

    /**
     * Notifies CallKit about an incoming call. This will display the system
     * incoming call view.
     *
     * @param {string} uuid - Unique identifier for the call.
     * @param {string} handle - Call handle in CallKit's terms. The room URL.
     * @param {boolean} hasVideo - True if it's a video call, false otherwise.
     * @returns {Promise}
     */
    displayIncomingCall(uuid, handle, hasVideo = true) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return Promise.resolve();
        }

        return RNCallKit.displayIncomingCall(uuid, handle, hasVideo);
    }

    /**
     * Request CallKit to end the call.
     *
     * @param {string} uuid - Unique identifier for the call.
     * @returns {Promise}
     */
    endCall(uuid) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return Promise.resolve();
        }

        return RNCallKit.endCall(uuid);
    }

    /**
     * Removes a listener for the given event.
     *
     * @param {string} event - Name of the event we are no longer interested in.
     * @param {Function} listener - Function which used to be called when the
     * desired event was emitted.
     * @returns {void}
     */
    removeEventListener(event, listener) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return;
        }

        this.removeListener(event, listener);
    }

    /**
     * Indicate CallKit that the outgoing call with the given UUID is now
     * connected.
     *
     * @param {string} uuid - Unique identifier for the call.
     * @returns {Promise}
     */
    reportConnectedOutgoingCall(uuid) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return Promise.resolve();
        }

        return RNCallKit.reportConnectedOutgoingCall(uuid);
    }

    /**
     * Indicate CallKit that the call with the given UUID has failed.
     *
     * @param {string} uuid - Unique identifier for the call.
     * @returns {Promise}
     */
    reportCallFailed(uuid) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return Promise.resolve();
        }

        return RNCallKit.reportCallFailed(uuid);
    }

    /**
     * Tell CallKit about the audio muted state.
     *
     * @param {string} uuid - Unique identifier for the call.
     * @param {boolean} muted - True if audio is muted, false otherwise.
     * @returns {Promise}
     */
    setMuted(uuid, muted) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return Promise.resolve();
        }

        return RNCallKit.setMuted(uuid, muted);
    }

    /**
     * Prepare / initialize CallKit. This method must be called before any
     * other.
     *
     * @param {Object} options - Initialization options.
     * @param {string} options.imageName - Image to be used in CallKit's
     * application button..
     * @param {string} options.ringtoneSound - Ringtone to be used for incoming
     * calls.
     * @returns {void}
     */
    setup(options = {}) {
        if (CallKit.isSupported()) {
            options.appName = NativeModules.AppInfo.name;
            RNCallKit.setup(options);
        }

        this._setup = true;
    }

    /**
     * Indicate CallKit about a new outgoing call.
     *
     * @param {string} uuid - Unique identifier for the call.
     * @param {string} handle - Call handle in CallKit's terms. The room URL in
     * our case.
     * @param {boolean} hasVideo - True if it's a video call, false otherwise.
     * @returns {Promise}
     */
    startCall(uuid, handle, hasVideo = true) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return Promise.resolve();
        }

        return RNCallKit.startCall(uuid, handle, hasVideo);
    }

    /**
     * Updates an ongoing call's parameters.
     *
     * @param {string} uuid - Unique identifier for the call.
     * @param {Object} options - Object with properties which should be updated.
     * @param {string} options.displayName - Display name for the caller.
     * @param {boolean} options.hasVideo - True if the call has video, false
     * otherwise.
     * @returns {Promise}
     */
    updateCall(uuid, options) {
        this._checkSetup();
        if (!CallKit.isSupported()) {
            return Promise.resolve();
        }

        return RNCallKit.updateCall(uuid, options);
    }
}

export default new CallKit();
