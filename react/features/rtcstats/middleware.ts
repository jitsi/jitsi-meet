import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import {
    CONFERENCE_JOINED,
    E2E_RTT_CHANGED
} from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_UPDATED } from '../base/tracks/actionTypes';
import { ADD_FACE_LANDMARKS } from '../face-landmarks/actionTypes';
import { FaceLandmarks } from '../face-landmarks/types';
import { sendGetCustomerIdRequest } from '../jaas/functions';

import RTCStats from './RTCStats';
import {
    canSendFaceLandmarksRTCStatsData,
    isRTCStatsEnabled
} from './functions';
import logger from './logger';

/**
 * Middleware which intercepts lib-jitsi-meet initialization and conference join in order init the
 * rtcstats-client.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const { getState } = store;
    const state = getState();

    switch (action.type) {
    case CONFERENCE_JOINED: {
        if (isRTCStatsEnabled(state)) {
            RTCStats.init();

            sendGetCustomerIdRequest(action?.conference, state)
                .then(customerData => {
                    const { customerId } = customerData ?? {};

                    customerId && RTCStats.sendIdentityData({ customerId });
                })
                .catch(error => {
                    logger.error('Error while getting customer id:', error);
                });
        }
        break;
    }
    case TRACK_UPDATED: {
        if (isRTCStatsEnabled(state)) {
            const { jitsiTrack, muted } = action?.track || { };
            const { isLocal, videoType: trackVideoType, conference } = jitsiTrack || { };

            if (trackVideoType === 'camera' && conference && isLocal()) {
                RTCStats.sendFaceLandmarksData({
                    duration: 0,
                    faceLandmarks: muted ? 'camera-off' : 'camera-on',
                    timestamp: Date.now()
                });
            }
        }
        break;
    }
    case E2E_RTT_CHANGED: {
        if (isRTCStatsEnabled(state)) {
            const { participant, rtt } = action.e2eRtt;

            RTCStats.sendE2ERTTData({
                remoteEndpointId: participant.getId(),
                rtt,
                remoteRegion: participant.getProperty('region')
            });
        }
        break;
    }
    case ADD_FACE_LANDMARKS: {
        if (canSendFaceLandmarksRTCStatsData(state)) {
            const { duration, faceExpression, timestamp } = action.faceLandmarks as FaceLandmarks;
            const durationSeconds = Math.round(duration / 1000);

            RTCStats.sendFaceLandmarksData({
                duration: durationSeconds,
                faceLandmarks: faceExpression,
                timestamp
            });
        }
        break;
    }
    }

    return next(action);
});
