import {
    MEDIA_TYPE,
    VIDEO_TYPE
} from '../media/constants';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import {
    TRACK_UPDATED
} from './actionTypes';
import {
    toggleScreensharing
} from './actions.native';

import './middleware.any';

/**
 * Middleware that captures LIB_DID_DISPOSE and LIB_DID_INIT actions and,
 * respectively, creates/destroys local media tracks. Also listens to
 * media-related actions and performs corresponding operations with tracks.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TRACK_UPDATED: {
        const { jitsiTrack, local } = action.track;

        if (local && jitsiTrack.isMuted()
                && jitsiTrack.type === MEDIA_TYPE.VIDEO && jitsiTrack.videoType === VIDEO_TYPE.DESKTOP) {
            store.dispatch(toggleScreensharing(false));
        }
        break;
    }
    }

    return next(action);
});
