import amplitude from 'amplitude-js';

import { getJitsiMeetGlobalNS } from '../../base/util';

import AbstractHandler from './AbstractHandler';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Analytics handler for Amplitude.
 */
class AmplitudeHandler extends AbstractHandler {
    /**
     * Creates new instance of the Amplitude analytics handler.
     *
     * @param {Object} options -
     * @param {string} options.amplitudeAPPKey - The Amplitude app key required
     * by the Amplitude API.
     */
    constructor(options) {
        super();

        const { amplitudeAPPKey } = options;

        if (!amplitudeAPPKey) {
            logger.warn(
                'Failed to initialize Amplitude handler, no tracking ID');

            return;
        }

        this._enabled = true;

        amplitude.getInstance().init(amplitudeAPPKey);
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

        amplitude.getInstance().logEvent(
            this._extractName(event),
            event);
    }
}

const globalNS = getJitsiMeetGlobalNS();

globalNS.analyticsHandlers = globalNS.analyticsHandlers || [];
globalNS.analyticsHandlers.push(AmplitudeHandler);
