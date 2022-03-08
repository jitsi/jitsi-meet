import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    getCurrentConference
} from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getParticipantCount } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED, TRACK_ADDED, TRACK_REMOVED } from '../base/tracks';

import { ADD_FACE_EXPRESSION, UPDATE_FACE_COORDINATES } from './actionTypes';
import {
    addToFaceExpressionsBuffer,
    loadWorker,
    stopFaceLandmarksDetection,
    startFaceLandmarksDetection
} from './actions';
import { FACE_BOX_EVENT_TYPE } from './constants';
import { sendFaceExpressionToParticipants, sendFaceExpressionToServer } from './functions';


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { faceLandmarks } = getState()['features/base/config'];
    const isEnabled = faceLandmarks?.enableFaceCentering || faceLandmarks?.enableFaceExpressionsDetection;

    if (action.type === CONFERENCE_JOINED) {
        if (isEnabled) {
            dispatch(loadWorker());
        }

        // allow using remote face centering data when local face centering is not enabled
        action.conference.on(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (participant, eventData) => {
                if (!participant || !eventData) {
                    return;
                }

                if (eventData.type === FACE_BOX_EVENT_TYPE) {
                    dispatch({
                        type: UPDATE_FACE_COORDINATES,
                        faceBox: eventData.faceBox,
                        id: participant.getId()
                    });
                }
            });

        return next(action);
    }


    if (!isEnabled) {
        return next(action);
    }

    switch (action.type) {
    case CONFERENCE_WILL_LEAVE : {
        dispatch(stopFaceLandmarksDetection());

        return next(action);
    }
    case TRACK_ADDED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType === 'camera' && isLocal()) {
            // need to pass this since the track is not yet added in the store
            dispatch(startFaceLandmarksDetection(action.track));
        }

        return next(action);
    }
    case TRACK_UPDATED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType !== 'camera' || !isLocal()) {
            return next(action);
        }

        const { muted } = action.track;

        if (muted !== undefined) {
            // addresses video mute state changes
            if (muted) {
                dispatch(stopFaceLandmarksDetection());
            } else {
                dispatch(startFaceLandmarksDetection());
            }
        }

        return next(action);
    }
    case TRACK_REMOVED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType === 'camera' && isLocal()) {
            dispatch(stopFaceLandmarksDetection());
        }

        return next(action);
    }
    case ADD_FACE_EXPRESSION: {
        const state = getState();
        const conference = getCurrentConference(state);

        if (getParticipantCount(state) > 1) {
            sendFaceExpressionToParticipants(conference, action.faceExpression, action.duration);
        }
        sendFaceExpressionToServer(conference, action.faceExpression, action.duration);
        dispatch(addToFaceExpressionsBuffer({
            emotion: action.faceExpression,
            timestamp: action.timestamp
        }));

        return next(action);
    }
    }

    return next(action);
});
