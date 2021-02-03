import amplitude from 'amplitude-js';

import logger from '../logger';

import AbstractHandler from './AbstractHandler';
import { fixDeviceID } from './amplitude';

/**
 * Analytics handler for Amplitude.
 */
export default class AmplitudeHandler extends AbstractHandler {
    /**
     * Creates new instance of the Amplitude analytics handler.
     *
     * @param {Object} options -
     * @param {string} options.amplitudeAPPKey - The Amplitude app key required
     * by the Amplitude API.
     */
    constructor(options) {
        super(options);

        const { amplitudeAPPKey, host, user } = options;

        this._enabled = true;
        this._host = host; // Only used on React Native.

        const onError = e => {
            logger.error('Error initializing Amplitude', e);
            this._enabled = false;
        };

        const amplitudeOptions = {
            domain: navigator.product === 'ReactNative' ? host : undefined,
            includeReferrer: true,
            onError
        };

        this._getInstance().init(amplitudeAPPKey, undefined, amplitudeOptions);
        fixDeviceID(this._getInstance());

        if (user) {
            this._getInstance().setUserId(user);
        }
    }

    /**
     * Returns the AmplitudeClient instance.
     *
     * @returns {AmplitudeClient}
     */
    _getInstance() {
        const name = navigator.product === 'ReactNative' ? this._host : undefined;

        return amplitude.getInstance(name);
    }

    /**
     * Sets the Amplitude user properties.
     *
     * @param {Object} userProps - The user portperties.
     * @returns {void}
     */
    setUserProperties(userProps) {
        if (this._enabled) {
            this._getInstance().setUserProperties(userProps);
        }
    }

    /**
     * Sends an event to Amplitude. The format of the event is described
     * in AnalyticsAdapter in lib-jitsi-meet.
     *
     * @param {Object} event - The event in the format specified by
     * lib-jitsi-meet.
     * @returns {void}
     */
    sendEvent(event) {
        if (this._shouldIgnore(event)) {
            return;
        }

        this._getInstance().logEvent(this._extractName(event), event);
    }

    /**
     * Return amplitude identity information.
     *
     * @returns {Object}
     */
    getIdentityProps() {
        return {
            sessionId: this._getInstance().getSessionId(),
            deviceId: this._getInstance().options.deviceId,
            userId: this._getInstance().options.userId
        };
    }
}
