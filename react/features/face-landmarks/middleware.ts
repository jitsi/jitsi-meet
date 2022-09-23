/* eslint-disable lines-around-comment */
import { IStore } from '../app/types';
import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE
} from '../base/conference/actionTypes';
// @ts-ignore
import { getCurrentConference } from '../base/conference/functions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getLocalParticipant, getParticipantCount } from '../base/participants/functions';
import { Participant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_UPDATED, TRACK_ADDED, TRACK_REMOVED } from '../base/tracks/actionTypes';

import FaceLandmarksDetector from './FaceLandmarksDetector';
import { ADD_FACE_EXPRESSION, NEW_FACE_COORDINATES, UPDATE_FACE_COORDINATES } from './actionTypes';
import {
    addToFaceExpressionsBuffer
} from './actions';
import { FACE_BOX_EVENT_TYPE } from './constants';
import { sendFaceBoxToParticipants, sendFaceExpressionToParticipants, sendFaceExpressionToServer } from './functions';


MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const { dispatch, getState } = store;
    const { faceLandmarks } = getState()['features/base/config'];
    const isEnabled = faceLandmarks?.enableFaceCentering || faceLandmarks?.enableFaceExpressionsDetection;

    if (action.type === CONFERENCE_JOINED) {
        if (isEnabled) {
            FaceLandmarksDetector.init(store);
        }

        // allow using remote face centering data when local face centering is not enabled
        action.conference.on(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (participant: Participant | undefined, eventData: any) => {
                if (!participant || !eventData || !participant.getId) {
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
        FaceLandmarksDetector.stopDetection(store);

        return next(action);
    }
    case TRACK_ADDED: {
        const { jitsiTrack: { isLocal, muted, videoType } } = action.track;

        if (videoType === 'camera' && isLocal() && !muted) {
            // need to pass this since the track is not yet added in the store
            FaceLandmarksDetector.startDetection(store, action.track);
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
                FaceLandmarksDetector.stopDetection(store);
            } else {
                FaceLandmarksDetector.startDetection(store);
            }
        }

        return next(action);
    }
    case TRACK_REMOVED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType === 'camera' && isLocal()) {
            FaceLandmarksDetector.stopDetection(store);
        }

        return next(action);
    }
    case ADD_FACE_EXPRESSION: {
        const state = getState();
        const { faceExpression, duration, timestamp } = action;
        const conference = getCurrentConference(state);

        if (getParticipantCount(state) > 1) {
            sendFaceExpressionToParticipants(conference, faceExpression, duration);
        }
        sendFaceExpressionToServer(conference, faceExpression, duration);
        dispatch(addToFaceExpressionsBuffer({
            emotion: faceExpression,
            timestamp
        }));

        return next(action);
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
    }
    }

    return next(action);
});
