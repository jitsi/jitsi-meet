// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED, TRACK_ADDED, TRACK_REMOVED } from '../base/tracks';
import { CHANGE_BACKGROUND } from '../virtual-background/actionTypes';

import {
    maybeStartFacialRecognition,
    stopFacialRecognition,
    resetTrack,
    setFacialRecognitionAllowed,
    changeTrack
} from './actions';


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { dispatch } = store;

        dispatch(setFacialRecognitionAllowed(true));
        dispatch(maybeStartFacialRecognition());

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
                dispatch(maybeStartFacialRecognition());
            }
            if (muted !== undefined) {
                if (muted) {
                    stopFacialRecognition();
                } else {
                    dispatch(maybeStartFacialRecognition());
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
            dispatch(maybeStartFacialRecognition());
            changeTrack(action.track);
        }

        return next(action);
    }

    case TRACK_REMOVED: {
        const { videoType } = action.track.jitsiTrack;

        if ([ 'camera', 'desktop' ].includes(videoType)) {
            stopFacialRecognition();
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
