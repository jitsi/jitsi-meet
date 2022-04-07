// @flow

import { jitsiLocalStorage } from '@jitsi/js-utils';

import { getAmplitudeIdentity } from '../analytics';
import { CONFERENCE_UNIQUE_ID_SET, E2E_RTT_CHANGED, getConferenceOptions, getRoomName } from '../base/conference';
import { LIB_WILL_INIT } from '../base/lib-jitsi-meet';
import { DOMINANT_SPEAKER_CHANGED, getLocalParticipant } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { ADD_FACE_EXPRESSION } from '../face-landmarks/actionTypes';

import RTCStats from './RTCStats';
import { canSendRtcstatsData, isRtcstatsEnabled } from './functions';
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
                // Default poll interval is 1000ms and standard stats will be used, if not provided in the config.
                const pollInterval = analytics.rtcstatsPollInterval || 1000;
                const useLegacy = analytics.rtcstatsUseLegacy || false;


                // Initialize but don't connect to the rtcstats server wss, as it will start sending data for all
                // media calls made even before the conference started.
                RTCStats.init({
                    endpoint: analytics.rtcstatsEndpoint,
                    useLegacy,
                    pollInterval
                });
            } catch (error) {
                logger.error('Failed to initialize RTCStats: ', error);
            }
        }
        break;
    }
    case CONFERENCE_UNIQUE_ID_SET: {
        if (canSendRtcstatsData(state)) {

            // Once the conference started connect to the rtcstats server and send data.
            try {
                RTCStats.connect();

                const localParticipant = getLocalParticipant(state);
                const options = getConferenceOptions(state);


                // Unique identifier for a conference session, not to be confused with meeting name
                // i.e. If all participants leave a meeting it will have a different value on the next join.
                const { conference } = action;
                const meetingUniqueId = conference && conference.getMeetingUniqueId();

                // The current implementation of rtcstats-server is configured to send data to amplitude, thus
                // we add identity specific information so we can correlate on the amplitude side. If amplitude is
                // not configured an empty object will be sent.
                // The current configuration of the conference is also sent as metadata to rtcstats server.
                // This is done in order to facilitate queries based on different conference configurations.
                // e.g. Find all RTCPeerConnections that connect to a specific shard or were created in a
                // conference with a specific version.
                // XXX(george): we also want to be able to correlate between rtcstats and callstats, so we're
                // appending the callstats user name (if it exists) to the display name.
                const displayName = options.statisticsId
                    || options.statisticsDisplayName
                    || jitsiLocalStorage.getItem('callStatsUserName');

                RTCStats.sendIdentityData({
                    ...getAmplitudeIdentity(),
                    ...options,
                    endpointId: localParticipant?.id,
                    confName: getRoomName(state),
                    displayName,
                    meetingUniqueId
                });
            } catch (error) {
                // If the connection failed do not impact jitsi-meet just silently fail.
                logger.error('RTCStats connect failed with: ', error);
            }
        }
        break;
    }
    case DOMINANT_SPEAKER_CHANGED: {
        if (canSendRtcstatsData(state)) {
            const { id, previousSpeakers } = action.participant;

            RTCStats.sendDominantSpeakerData({ dominantSpeakerEndpoint: id,
                previousSpeakers });
        }
        break;
    }
    case E2E_RTT_CHANGED: {
        if (canSendRtcstatsData(state)) {
            const { participant, rtt } = action.e2eRtt;

            RTCStats.sendE2eRttData({
                remoteEndpointId: participant.getId(),
                rtt,
                remoteRegion: participant.getProperty('region')
            });
        }
        break;
    }
    case ADD_FACE_EXPRESSION: {
        if (canSendRtcstatsData(state)) {
            const { duration, faceExpression } = action;

            RTCStats.sendFaceExpressionData({
                duration,
                faceExpression
            });
        }
        break;
    }
    }

    return next(action);
});
