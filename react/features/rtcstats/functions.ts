// @ts-ignore
import { jitsiLocalStorage } from '@jitsi/js-utils';

import { getAmplitudeIdentity } from '../analytics/functions';
import { IStore } from '../app/types';
import { IStateful } from '../base/app/types';
import { getAnalyticsRoomName, getConferenceOptions } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants/functions';
import { toState } from '../base/redux/functions';

import RTCStats from './RTCStats';
import logger from './logger';

/**
 * Checks whether rtcstats is enabled or not.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isRtcstatsEnabled(stateful: IStateful) {
    const state = toState(stateful);
    const { analytics } = state['features/base/config'];

    return analytics?.rtcstatsEnabled ?? false;
}

/**
 * Can the rtcstats service send data.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function canSendRtcstatsData(stateful: IStateful) {
    return isRtcstatsEnabled(stateful) && RTCStats.isInitialized();
}

type Identity = {
    isBreakoutRoom: boolean;

    // Unique identifier for a conference session, not to be confused with meeting name
    // i.e. If all participants leave a meeting it will have a different value on the next join.
    meetingUniqueId?: string;
    roomId?: string;
};

/**
 * Connects to the rtcstats service and sends the identity data.
 *
 * @param {IStore} store - Redux Store.
 * @param {Identity} identity - Identity data for the client.
 * @returns {void}
 */
export function connectAndSendIdentity({ getState, dispatch }: IStore, identity: Identity) {
    const state = getState();

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
            let displayName = jitsiLocalStorage.getItem('callStatsUserName');

            if (options.statisticsId || options.statisticsDisplayName) {
                if (options.statisticsId && options.statisticsDisplayName) {
                    displayName = `${options.statisticsDisplayName} (${options.statisticsId})`;
                } else {
                    displayName = options.statisticsId || options.statisticsDisplayName;
                }
            }

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

/**
 * Checks if the faceLandmarks data can be sent to the rtcstats server.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function canSendFaceLandmarksRtcstatsData(stateful: IStateful): boolean {
    const state = toState(stateful);
    const { faceLandmarks } = state['features/base/config'];

    if (faceLandmarks?.enableRTCStats && canSendRtcstatsData(state)) {
        return true;
    }

    return false;
}
