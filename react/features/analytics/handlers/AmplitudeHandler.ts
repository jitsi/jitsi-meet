import { Identify } from '@amplitude/analytics-core';

import logger from '../logger';

import AbstractHandler, { IEvent } from './AbstractHandler';
import { fixDeviceID } from './amplitude/fixDeviceID';
import amplitude from './amplitude/lib';

/**
 * Analytics handler for Amplitude.
 */
export default class AmplitudeHandler extends AbstractHandler {
    _deviceId: string;
    _userId: Object;

    /**
     * Creates new instance of the Amplitude analytics handler.
     *
     * @param {Object} options - The amplitude options.
     * @param {string} options.amplitudeAPPKey - The Amplitude app key required by the Amplitude API.
     * @param {boolean} options.amplitudeIncludeUTM - Whether to include UTM parameters
     * in the Amplitude events.
     */
    constructor(options: any) {
        super(options);

        const {
            amplitudeAPPKey,
            amplitudeIncludeUTM: includeUtm = true,
            user
        } = options;

        this._enabled = true;

        const onError = (e: Error) => {
            logger.error('Error initializing Amplitude', e);
            this._enabled = false;
        };

        // Forces sending all events on exit (flushing) via sendBeacon
        const onExitPage = () => {
            amplitude.flush();
        };

        if (navigator.product === 'ReactNative') {
            amplitude.init(amplitudeAPPKey);
            fixDeviceID(amplitude).then(() => {
                const deviceId = amplitude.getDeviceId();

                if (deviceId) {
                    this._deviceId = deviceId;
                }
            });
        } else {
            const amplitudeOptions: any = {
                includeReferrer: true,
                includeUtm,
                saveParamsReferrerOncePerSession: false,
                onError,
                onExitPage
            };

            amplitude.init(amplitudeAPPKey, undefined, amplitudeOptions);
            fixDeviceID(amplitude);
        }

        if (user) {
            this._userId = user;
            amplitude.setUserId(user);
        }
    }

    /**
     * Sets the Amplitude user properties.
     *
     * @param {Object} userProps - The user portperties.
     * @returns {void}
     */
    setUserProperties(userProps: any) {
        if (this._enabled) {
            const identify = new Identify();

            // Set all properties
            Object.entries(userProps).forEach(([ key, value ]) => {
                identify.set(key, value as any);
            });

            amplitude.identify(identify);
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
    sendEvent(event: IEvent) {
        if (this._shouldIgnore(event)) {
            return;
        }

        const eventName = this._extractName(event) ?? '';

        amplitude.logEvent(eventName, event);
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
            sessionId: amplitude.getSessionId(),
            deviceId: amplitude.getDeviceId(),
            userId: amplitude.getUserId()
        };
    }
}
