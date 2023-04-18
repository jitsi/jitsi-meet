import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import {
    CONFERENCE_JOINED,
    CONFERENCE_TIMESTAMP_CHANGED,
    CONFERENCE_UNIQUE_ID_SET,
    CONFERENCE_WILL_LEAVE,
    E2E_RTT_CHANGED
} from '../base/conference/actionTypes';
import { LIB_WILL_INIT } from '../base/lib-jitsi-meet/actionTypes';
import { DOMINANT_SPEAKER_CHANGED } from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_ADDED, TRACK_UPDATED } from '../base/tracks/actionTypes';
import { getCurrentRoomId, isInBreakoutRoom } from '../breakout-rooms/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';
import { ADD_FACE_LANDMARKS } from '../face-landmarks/actionTypes';
import { FaceLandmarks } from '../face-landmarks/types';

import RTCStats from './RTCStats';
import {
    canSendFaceLandmarksRtcstatsData,
    canSendRtcstatsData,
    connectAndSendIdentity,
    isRtcstatsEnabled
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
                // Default poll interval is 10000ms and standard stats will be used, if not provided in the config.
                const pollInterval = analytics?.rtcstatsPollInterval || 10000;
                const useLegacy = analytics?.rtcstatsUseLegacy || false;
                const sendSdp = analytics?.rtcstatsSendSdp || false;

                // Initialize but don't connect to the rtcstats server wss, as it will start sending data for all
                // media calls made even before the conference started.

                RTCStats.maybeInit({
                    endpoint: analytics?.rtcstatsEndpoint,
                    meetingFqn: extractFqnFromPath(state),
                    useLegacy,
                    pollInterval,
                    sendSdp
                });
            } catch (error) {
                logger.error('Failed to initialize RTCStats: ', error);
            }
        } else {
            RTCStats.reset();
        }
        break;
    }

    // Used for connecting to rtcstats server when joining a breakout room.
    // Breakout rooms do not have a meetingUniqueId.
    case CONFERENCE_JOINED: {
        if (isInBreakoutRoom(getState())) {
            connectAndSendIdentity(
                store,
                {
                    isBreakoutRoom: true,
                    roomId: getCurrentRoomId(getState())
                }
            );
        }
        break;
    }

    // Used for connecting to rtcstats server when joining the main room.
    // Using this event to be sure the meetingUniqueId can be retrieved.
    case CONFERENCE_UNIQUE_ID_SET: {
        if (!isInBreakoutRoom(getState())) {
            // Unique identifier for a conference session, not to be confused with meeting name
            // i.e. If all participants leave a meeting it will have a different value on the next join.
            const { conference } = action;
            const meetingUniqueId = conference?.getMeetingUniqueId();

            connectAndSendIdentity(
                store,
                {
                    isBreakoutRoom: false,
                    meetingUniqueId
                }
            );
        }
        break;
    }
    case TRACK_ADDED: {
        if (canSendRtcstatsData(state)) {
            const jitsiTrack = action?.track?.jitsiTrack;
            const { ssrc, videoType } = jitsiTrack || { };

            // Remote tracks store their ssrc in the jitsiTrack object. Local tracks don't. See getSsrcByTrack.
            if (videoType && ssrc && !jitsiTrack.isLocal() && !jitsiTrack.isAudioTrack()) {
                RTCStats.sendVideoTypeData({
                    ssrc,
                    videoType
                });
            }
        }
        break;
    }
    case TRACK_UPDATED: {
        if (canSendRtcstatsData(state)) {
            const { videoType, jitsiTrack, muted } = action?.track || { };
            const { ssrc, isLocal, videoType: trackVideoType, conference } = jitsiTrack || { };

            if (trackVideoType === 'camera' && conference && isLocal()) {
                RTCStats.sendFaceLandmarksData({
                    duration: 0,
                    faceLandmarks: muted ? 'camera-off' : 'camera-on',
                    timestamp: Date.now()
                });
            }

            // if the videoType of the remote track has changed we expect to find it in track.videoType. grep for
            // trackVideoTypeChanged.
            if (videoType && ssrc && !jitsiTrack.isLocal() && !jitsiTrack.isAudioTrack()) {

                RTCStats.sendVideoTypeData({
                    ssrc,
                    videoType
                });
            }
        }
        break;
    }
    case DOMINANT_SPEAKER_CHANGED: {
        if (canSendRtcstatsData(state)) {
            const { id, previousSpeakers, silence } = action.participant;

            RTCStats.sendDominantSpeakerData({
                dominantSpeakerEndpoint: silence ? null : id,
                previousSpeakers
            });
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
    case ADD_FACE_LANDMARKS: {
        if (canSendFaceLandmarksRtcstatsData(state)) {
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
    case CONFERENCE_TIMESTAMP_CHANGED: {
        if (canSendRtcstatsData(state)) {
            const { conferenceTimestamp } = action;

            RTCStats.sendConferenceTimestamp(conferenceTimestamp);
        }
        break;
    }
    case CONFERENCE_WILL_LEAVE: {
        if (canSendRtcstatsData(state)) {
            RTCStats.close();
        }
        break;
    }
    }

    return next(action);
});
