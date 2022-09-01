/* eslint-disable import/order */
// @ts-ignore
import { jitsiLocalStorage } from '@jitsi/js-utils';

// @ts-ignore
import { getAmplitudeIdentity } from '../analytics';
import {
    getConferenceOptions,
    getAnalyticsRoomName

    // @ts-ignore
} from '../base/conference';

// @ts-ignore
import { getLocalParticipant } from '../base/participants';

// @ts-ignore
import { toState } from '../base/redux';

import RTCStats from './RTCStats';
import logger from './logger';

/**
 * Checks whether rtcstats is enabled or not.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isRtcstatsEnabled(stateful: Function | Object) {
    const state = toState(stateful);
    const config = state['features/base/config'];

    return config?.analytics?.rtcstatsEnabled ?? false;
}

/**
 * Can the rtcstats service send data.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function canSendRtcstatsData(stateful: Function | Object) {
    return isRtcstatsEnabled(stateful) && RTCStats.isInitialized();
}

type Identity = {
    isBreakoutRoom: boolean;

    // Unique identifier for a conference session, not to be confused with meeting name
    // i.e. If all participants leave a meeting it will have a different value on the next join.
    meetingUniqueId?: string;
    roomId?: string;
}

/**
 * Connects to the rtcstats service and sends the identity data.
 *
 * @param {Function} dispatch - The redux dispatch function.
 * @param  {Function|Object} stateful - The redux store or {@code getState} function.
 * @param {Identity} identity - Identity data for the client.
 * @returns {void}
 */
export function connectAndSendIdentity(dispatch: Function, stateful: Function | Object, identity: Identity) {
    const state = toState(stateful);

    if (canSendRtcstatsData(state)) {

        // Once the conference started connect to the rtcstats server and send data.
        try {
            RTCStats.connect(identity.isBreakoutRoom);
            const localParticipant = getLocalParticipant(state);
            const options = getConferenceOptions(state);

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
                confName: getAnalyticsRoomName(state, dispatch),
                displayName,
                ...identity
            });
        } catch (error) {
            // If the connection failed do not impact jitsi-meet just silently fail.
            logger.error('RTCStats connect failed with: ', error);
        }
    }

}
