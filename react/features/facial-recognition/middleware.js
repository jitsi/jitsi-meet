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
        const { getState, dispatch } = store;
        const { disableFacialRecognition } = getState()['features/base/config'];

        if (disableFacialRecognition) {
            return next(action);
        }

        dispatch(loadWorker());
        dispatch(setFacialRecognitionAllowed(true));
        dispatch(startFacialRecognition());

        return next(action);
    }

    case CONFERENCE_WILL_LEAVE : {
        const { getState, dispatch } = store;
        const { disableFacialRecognition } = getState()['features/base/config'];

        if (disableFacialRecognition) {
            return next(action);
        }

        dispatch(stopFacialRecognition());

        return next(action);
    }

    case TRACK_UPDATED: {
        const { getState, dispatch } = store;
        const { facialRecognitionAllowed } = getState()['features/facial-recognition'];

        if (!facialRecognitionAllowed) {
            return next(action);
        }
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
        const { getState, dispatch } = store;
        const { facialRecognitionAllowed } = getState()['features/facial-recognition'];

        if (!facialRecognitionAllowed) {
            return next(action);
        }
        const { mediaType, videoType } = action.track;

        if (mediaType === 'presenter' && videoType === 'camera') {
            dispatch(startFacialRecognition());
            changeTrack(action.track);
        }

        return next(action);
    }

    case TRACK_REMOVED: {
        const { getState, dispatch } = store;
        const { facialRecognitionAllowed } = getState()['features/facial-recognition'];

        if (!facialRecognitionAllowed) {
            return next(action);
        }
        const { videoType } = action.track.jitsiTrack;

        if ([ 'camera', 'desktop' ].includes(videoType)) {
            dispatch(stopFacialRecognition());
        }

        return next(action);
    }
    case CHANGE_BACKGROUND: {
        const { getState, dispatch } = store;
        const { facialRecognitionAllowed } = getState()['features/facial-recognition'];

        if (!facialRecognitionAllowed) {
            return next(action);
        }
        dispatch(resetTrack());

        return next(action);
    }
    }

    return next(action);
});
