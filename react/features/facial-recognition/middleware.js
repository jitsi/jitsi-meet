// @flow

import { MiddlewareRegistry } from '../base/redux';
import { TRACK_UPDATED } from '../base/tracks';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TRACK_UPDATED: {
        const result = next(action);
        const { track } = action;

        return result;
    }
    }

    return next(action);
});
