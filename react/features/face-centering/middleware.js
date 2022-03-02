import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    getCurrentConference
} from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED, TRACK_REMOVED, TRACK_ADDED } from '../base/tracks';

import { UPDATE_FACE_COORDINATES } from './actionTypes';
import {
    loadWorker,
    stopFaceRecognition,
    startFaceRecognition
} from './actions';
import { FACE_BOX_EVENT_TYPE } from './constants';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const state = getState();
    const { faceCoordinatesSharing } = state['features/base/config'];

    if (!getCurrentConference(state)) {
        return next(action);
    }

    if (action.type === CONFERENCE_JOINED) {
        if (faceCoordinatesSharing?.enabled) {
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

    if (!faceCoordinatesSharing?.enabled) {
        return next(action);
    }

    switch (action.type) {
    case CONFERENCE_WILL_LEAVE : {
        dispatch(stopFaceRecognition());

        return next(action);
    }
    case TRACK_ADDED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType === 'camera' && isLocal()) {
            // need to pass this since the track is not yet added in the store
            dispatch(startFaceRecognition(action.track));
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
                dispatch(stopFaceRecognition());
            } else {
                dispatch(startFaceRecognition());
            }
        }

        return next(action);
    }
    case TRACK_REMOVED: {
        const { jitsiTrack: { isLocal, videoType } } = action.track;

        if (videoType === 'camera' && isLocal()) {
            dispatch(stopFaceRecognition());
        }

        return next(action);
    }
    }

    return next(action);
});
