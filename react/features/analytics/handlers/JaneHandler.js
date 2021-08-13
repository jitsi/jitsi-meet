import { getJitsiMeetGlobalNS } from '../../base/util';

import AbstractHandler from './AbstractHandler';

/**
 * Analytics handler for Jane.
 */
export default class JaneHandler extends AbstractHandler {

    /**
     * Creates new instance of the Jane handler.
     *
     * @param {Object} options -
     * @param {string} options.janeEndpoint - The Jane endpoint.
     * @param {string} options.jwt - The Jane jwt token.
     * @param {string} options.participant - The participant info.
     */
    constructor(options) {
        super(options);
        this._userProperties = {};

        if (!options.janeEndpoint || !options.jwt) {
            throw new Error(
                'Failed to initialize Jane handler: no endpoint or jwt defined.'
            );
        }
        this._enabled = true;
        this._janeEndpoint = options.janeEndpoint;
        this._participant = options.participant;
    }

    /**
     * Sends an event to Jane. The format of the event is described
     * in AnalyticsAdapter in lib-jitsi-meet.
     *
     * @param {Object} event - The event in the format specified by
     * lib-jitsi-meet.
     * @returns {Promise}
     */
    sendEvent(event) {
        if (this._shouldIgnore(event)) {
            return;
        }
        const eventName = this._extractName(event);
        const participant = this._participant;

        return fetch(this._janeEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'name': eventName,
                'participant_id': participant.participant_id,
                'participant_type': participant.participant_type,
                ...event
            })
        });
    }

}

const globalNS = getJitsiMeetGlobalNS();

globalNS.analyticsHandlers = globalNS.analyticsHandlers || [];
globalNS.analyticsHandlers.push(JaneHandler);
