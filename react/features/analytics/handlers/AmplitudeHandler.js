import AbstractHandler from './AbstractHandler';
import { amplitude, fixDeviceID } from './amplitude';

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

        if (!amplitudeAPPKey) {
            throw new Error('Failed to initialize Amplitude handler, no APP key');
        }

        this._enabled = true;

        this._amplitudeOptions = {
            host
        };

        amplitude.getInstance(this._amplitudeOptions).init(amplitudeAPPKey, undefined, { includeReferrer: true });
        fixDeviceID(amplitude.getInstance(this._amplitudeOptions));

        if (user) {
            amplitude.getInstance(this._amplitudeOptions).setUserId(user);
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
            amplitude.getInstance(this._amplitudeOptions)
                .setUserProperties(userProps);
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

        amplitude.getInstance(this._amplitudeOptions).logEvent(
            this._extractName(event),
            event);
    }
}
