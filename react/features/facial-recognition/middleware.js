// @flow

import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED, TRACK_ADDED } from '../base/tracks';
import { CHANGE_BACKGROUND } from '../virtual-background/actionTypes';

import { maybeStartFacialRecognition, stopFacialRecognition, resetTrack } from './actions';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TRACK_UPDATED: {
        const { muted } = action.track;

        const { dispatch } = store;

        if (typeof muted !== undefined) {
            if (muted) {
                stopFacialRecognition();
            } else {
                dispatch(maybeStartFacialRecognition(action.track.jitsiTrack));
            }
        }

        const { videoType } = action.track.jitsiTrack;

        if (videoType === 'desktop') {
            stopFacialRecognition();
        }

        return next(action);
    }
    case TRACK_ADDED: {

        const { dispatch } = store;
        const { mediaType, videoType } = action.track;

        if (mediaType === 'presenter' && videoType === 'camera') {
            dispatch(maybeStartFacialRecognition(action.track.jitsiTrack));
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
