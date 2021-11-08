// @flow

import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    getCurrentConference,
    getIsConferenceJoined
} from '../base/conference';
import { getParticipantCount } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED, TRACK_ADDED, TRACK_REMOVED } from '../base/tracks';
import { VIRTUAL_BACKGROUND_TRACK_CHANGED } from '../virtual-background/actionTypes';

import { ADD_FACIAL_EXPRESSION } from './actionTypes';
import {
    changeTrack,
    loadWorker,
    resetTrack,
    stopFacialRecognition,
    startFacialRecognition
} from './actions';
import { sendFacialExpressionToParticipants, sendFacialExpressionToServer } from './functions';


MiddlewareRegistry.register(store => next => action => {
    const { enableFacialRecognition } = store.getState()['features/base/config'];

    if (!enableFacialRecognition) {
        return next(action);
    }

    if (action.type === CONFERENCE_JOINED) {
        const { dispatch } = store;

        dispatch(loadWorker());
        dispatch(startFacialRecognition());

        return next(action);
    }

    if (!getIsConferenceJoined(store.getState())) {
        return next(action);
    }
    switch (action.type) {
    case CONFERENCE_WILL_LEAVE : {
        const { dispatch } = store;

        dispatch(stopFacialRecognition());

        return next(action);
    }

    case TRACK_UPDATED: {
        const { dispatch } = store;

        const { videoType, type } = action.track.jitsiTrack;

        if (videoType === 'camera') {
            const { muted, videoStarted } = action.track;

            if (videoStarted === true) {
                dispatch(startFacialRecognition());
            }
            if (muted !== undefined) {
                if (muted) {
                    dispatch(stopFacialRecognition());
                } else {
                    dispatch(startFacialRecognition());
                    type === 'presenter' && changeTrack(action.track);
                }
            }
        }

        return next(action);
    }
    case TRACK_ADDED: {
        const { dispatch } = store;
        const { mediaType, videoType } = action.track;

        if (mediaType === 'presenter' && videoType === 'camera') {
            dispatch(startFacialRecognition());
            changeTrack(action.track);
        }

        return next(action);
    }

    case TRACK_REMOVED: {
        const { dispatch } = store;
        const { videoType } = action.track.jitsiTrack;

        if ([ 'camera', 'desktop' ].includes(videoType)) {
            dispatch(stopFacialRecognition());
        }

        return next(action);
    }

    case VIRTUAL_BACKGROUND_TRACK_CHANGED: {
        const { dispatch } = store;

        dispatch(resetTrack());

        return next(action);
    }

    case ADD_FACIAL_EXPRESSION: {
        const { getState } = store;
        const state = getState();
        const conference = getCurrentConference(state);

        if (getParticipantCount(state) > 1) {
            sendFacialExpressionToParticipants(conference, action.facialExpression, action.duration);
        }
        sendFacialExpressionToServer(conference, action.facialExpression, action.duration);

        return next(action);
    }
    }

    return next(action);
});
