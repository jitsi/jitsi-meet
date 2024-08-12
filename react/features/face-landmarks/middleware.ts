import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    ENDPOINT_MESSAGE_RECEIVED
} from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getParticipantCount } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_ADDED, TRACK_REMOVED, TRACK_UPDATED } from '../base/tracks/actionTypes';

import FaceLandmarksDetector from './FaceLandmarksDetector';
import { ADD_FACE_LANDMARKS, NEW_FACE_COORDINATES, UPDATE_FACE_COORDINATES } from './actionTypes';
import { FACE_BOX_EVENT_TYPE } from './constants';
import { sendFaceBoxToParticipants, sendFaceExpressionToParticipants } from './functions';


MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const { dispatch, getState } = store;
    const { faceLandmarks: faceLandmarksConfig } = getState()['features/base/config'];
    const isEnabled = faceLandmarksConfig?.enableFaceCentering || faceLandmarksConfig?.enableFaceExpressionsDetection;

    if (action.type === CONFERENCE_JOINED) {
        if (isEnabled) {
            FaceLandmarksDetector.init(store);
        }

        return next(action);
    } else if (action.type === ENDPOINT_MESSAGE_RECEIVED) {
        // Allow using remote face centering data when local face centering is not enabled.
        const { participant, data } = action;

        if (data?.type === FACE_BOX_EVENT_TYPE) {
            dispatch({
                type: UPDATE_FACE_COORDINATES,
                faceBox: data.faceBox,
                id: participant.getId()
            });
        }

        return next(action);
    }

    if (!isEnabled) {
        return next(action);
    }

    switch (action.type) {
    case CONFERENCE_WILL_LEAVE : {
        FaceLandmarksDetector.stopDetection(store);

        break;
    }
    case TRACK_ADDED: {
        const { jitsiTrack: { isLocal, videoType }, muted } = action.track;

        if (videoType === 'camera' && isLocal() && !muted) {
            // need to pass this since the track is not yet added in the store
            FaceLandmarksDetector.startDetection(store, action.track);
        }

        break;
    }
    case TRACK_UPDATED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType !== 'camera' || !isLocal()) {
            break;
        }

        const { muted } = action.track;

        if (typeof muted !== 'undefined') {
            // addresses video mute state changes
            if (muted) {
                FaceLandmarksDetector.stopDetection(store);
            } else {
                FaceLandmarksDetector.startDetection(store);
            }
        }

        break;
    }
    case TRACK_REMOVED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType === 'camera' && isLocal()) {
            FaceLandmarksDetector.stopDetection(store);
        }

        break;
    }
    case ADD_FACE_LANDMARKS: {
        const state = getState();
        const { faceLandmarks } = action;
        const conference = getCurrentConference(state);

        if (getParticipantCount(state) > 1) {
            sendFaceExpressionToParticipants(conference, faceLandmarks);
        }

        // Disabling for now as there is no value of having the data in speakerstats at the server
        // sendFaceExpressionToServer(conference, faceLandmarks);

        break;
    }
    case NEW_FACE_COORDINATES: {
        const state = getState();
        const { faceBox } = action;
        const conference = getCurrentConference(state);
        const localParticipant = getLocalParticipant(state);

        if (getParticipantCount(state) > 1) {
            sendFaceBoxToParticipants(conference, faceBox);
        }

        dispatch({
            type: UPDATE_FACE_COORDINATES,
            faceBox,
            id: localParticipant?.id
        });

        break;
    }
    }

    return next(action);
});
