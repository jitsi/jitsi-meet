// @flow

import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED } from '../base/tracks';
import { maybeStartFacialRecognition, stopFacialRecognition } from './actions';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TRACK_UPDATED: {
        const { muted } = action.track;
        const { dispatch } = store;

        if (typeof muted !== undefined) {
            if (muted) {
                stopFacialRecognition();
            } else {
                dispatch(maybeStartFacialRecognition());
            }
        }

        return next(action);
    }
    }

    return next(action);
});
