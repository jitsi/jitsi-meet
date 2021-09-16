// @flow

import { CONFERENCE_JOINED, CONFERENCE_WILL_LEAVE } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED, TRACK_ADDED, TRACK_REMOVED } from '../base/tracks';
import { CHANGE_BACKGROUND } from '../virtual-background/actionTypes';

import {
    startFacialRecognition,
    stopFacialRecognition,
    resetTrack,
    setFacialRecognitionAllowed,
    changeTrack,
    loadWorker
} from './actions';


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { dispatch } = store;

        dispatch(loadWorker());
        dispatch(setFacialRecognitionAllowed(true));
        dispatch(startFacialRecognition());

        return next(action);
    }

    case CONFERENCE_WILL_LEAVE : {
        const { dispatch } = store;

        dispatch(stopFacialRecognition());

        return next(action);
    }

    case TRACK_UPDATED: {
        const { getState } = store;
        const state = getState();
        const { facialRecognitionAllowed } = state['features/facial-recognition'];
        const { videoType, type } = action.track.jitsiTrack;

        if (facialRecognitionAllowed && videoType === 'camera') {
            const { muted, videoStarted } = action.track;
            const { dispatch } = store;

            if (videoStarted === true) {
                dispatch(startFacialRecognition());
            }
            if (muted !== undefined) {
                if (muted) {
                    dispatch(stopFacialRecognition());
                } else {
                    dispatch(startFacialRecognition());
                    // eslint-disable-next-line max-depth
                    if (type === 'presenter') {
                        changeTrack(action.track);
                    }
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
        const { videoType } = action.track.jitsiTrack;
        const { dispatch } = store;

        if ([ 'camera', 'desktop' ].includes(videoType)) {
            dispatch(stopFacialRecognition());
        }

        return next(action);
    }
    case CHANGE_BACKGROUND: {
        const { dispatch } = store;

        dispatch(resetTrack());

        return next(action);
    }
    }

    return next(action);
});
