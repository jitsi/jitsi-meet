import logger from '../logger';

import AbstractHandler from './AbstractHandler';
import { fixDeviceID } from './amplitude/fixDeviceID';
import amplitude from './amplitude/lib';

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

        const { amplitudeAPPKey, user } = options;

        this._enabled = true;

        const onError = e => {
            logger.error('Error initializing Amplitude', e);
            this._enabled = false;
        };

        if (navigator.product === 'ReactNative') {
            amplitude.getInstance().init(amplitudeAPPKey);
            fixDeviceID(amplitude.getInstance()).then(() => {
                amplitude.getInstance().getDeviceId()
                    .then(deviceId => {
                        this._deviceId = deviceId;
                    });
            });
        } else {
            const amplitudeOptions = {
                includeReferrer: true,
                onError
            };

            amplitude.getInstance().init(amplitudeAPPKey, undefined, amplitudeOptions);
            fixDeviceID(amplitude.getInstance());
        }

        if (user) {
            this._userId = user;
            amplitude.getInstance().setUserId(user);
        }
    }

    /**
     * Sets the Amplitude user properties.
     *
     * @param {Object} userProps - The user portperties.
     * @returns {void}
     */
    setUserProperties(userProps) {
        if (this._enabled) {
            amplitude.getInstance().setUserProperties(userProps);
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

        amplitude.getInstance().logEvent(this._extractName(event), event);
    }

    /**
     * Return amplitude identity information.
     *
     * @returns {Object}
     */
    getIdentityProps() {
        if (navigator.product === 'ReactNative') {
            return {
                deviceId: this._deviceId,
                userId: this._userId
            };
        }

        return {
            sessionId: amplitude.getInstance().getSessionId(),
            deviceId: amplitude.getInstance().options.deviceId,
            userId: amplitude.getInstance().options.userId
        };
    }
}
