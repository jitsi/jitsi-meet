import { Identify } from '@amplitude/analytics-core';

import logger from '../logger';

import AbstractHandler, { IEvent } from './AbstractHandler';
import { fixDeviceID } from './amplitude/fixDeviceID';
import amplitude, { initAmplitude } from './amplitude/lib';

/**
 * Analytics handler for Amplitude.
 */
export default class AmplitudeHandler extends AbstractHandler {

    /**
     * Creates new instance of the Amplitude analytics handler.
     *
     * @param {Object} options - The amplitude options.
     * @param {string} options.amplitudeAPPKey - The Amplitude app key required by the Amplitude API
     * in the Amplitude events.
     */
    constructor(options: any) {
        super(options);

        const {
            amplitudeAPPKey,
            user
        } = options;

        this._enabled = true;

        initAmplitude(amplitudeAPPKey, user)
            .then(() => {
                logger.info('Amplitude initialized');
                fixDeviceID(amplitude);
            })
            .catch(e => {
                logger.error('Error initializing Amplitude', e);
                this._enabled = false;
            });
    }

    /**
     * Sets the Amplitude user properties.
     *
     * @param {Object} userProps - The user properties.
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

        amplitude.track(eventName, event);
    }

    /**
     * Return amplitude identity information.
     *
     * @returns {Object}
     */
    getIdentityProps() {
        return {
            sessionId: amplitude.getSessionId(),
            deviceId: amplitude.getDeviceId(),
            userId: amplitude.getUserId()
        };
    }
}
