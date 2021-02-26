// @flow

import { getAmplitudeIdentity } from '../analytics';
import { CONFERENCE_UNIQUE_ID_SET } from '../base/conference';
import { LIB_WILL_INIT } from '../base/lib-jitsi-meet';
import { getLocalParticipant } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import RTCStats from './RTCStats';
import { isRtcstatsEnabled } from './functions';
import logger from './logger';

/**
 * Middleware which intercepts lib-jitsi-meet initialization and conference join in order init the
 * rtcstats-client.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const state = store.getState();
    const config = state['features/base/config'];
    const { analytics } = config;

    switch (action.type) {
    case LIB_WILL_INIT: {
        if (isRtcstatsEnabled(state)) {
            // RTCStats "proxies" WebRTC functions such as GUM and RTCPeerConnection by rewriting the global
            // window functions. Because lib-jitsi-meet uses references to those functions that are taken on
            // init, we need to add these proxies before it initializes, otherwise lib-jitsi-meet will use the
            // original non proxy versions of these functions.
            try {
                // Default poll interval is 1000ms if not provided in the config.
                const pollInterval = analytics.rtcstatsPollInterval || 1000;

                // Initialize but don't connect to the rtcstats server wss, as it will start sending data for all
                // media calls made even before the conference started.
                RTCStats.init({
                    rtcstatsEndpoint: analytics.rtcstatsEndpoint,
                    rtcstatsPollInterval: pollInterval
                });
            } catch (error) {
                logger.error('Failed to initialize RTCStats: ', error);
            }
        }
        break;
    }
    case CONFERENCE_UNIQUE_ID_SET: {
        if (isRtcstatsEnabled(state) && RTCStats.isInitialized()) {
            // Once the conference started connect to the rtcstats server and send data.
            try {
                RTCStats.connect();

                const localParticipant = getLocalParticipant(state);

                // Unique identifier for a conference session, not to be confused with meeting name
                // i.e. If all participants leave a meeting it will have a different value on the next join.
                const { conference } = action;
                const meetingUniqueId = conference && conference.getMeetingUniqueId();

                // The current implementation of rtcstats-server is configured to send data to amplitude, thus
                // we add identity specific information so we can corelate on the amplitude side. If amplitude is
                // not configured an empty object will be sent.
                // The current configuration of the conference is also sent as metadata to rtcstats server.
                // This is done in order to facilitate queries based on different conference configurations.
                // e.g. Find all RTCPeerConnections that connect to a specific shard or were created in a
                // conference with a specific version.
                RTCStats.sendIdentityData({
                    ...getAmplitudeIdentity(),
                    ...config,
                    displayName: localParticipant?.name,
                    meetingUniqueId
                });
            } catch (error) {
                // If the connection failed do not impact jitsi-meet just silently fail.
                logger.error('RTCStats connect failed with: ', error);
            }
        }
        break;
    }
    }

    return next(action);
});
