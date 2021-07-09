// @flow

import { VIDEO_TYPE } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { getLocalVideoTrack } from '../base/tracks';

import { localTrackStopped } from './functions';

/**
 * Middleware which intercepts the desktop video type on
 * virtual background. If the user stops the screen share
 * then the default virtual background is set to 'none' option
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { dispatch, getState } = store;
    const virtualSource = getState()['features/virtual-background'].virtualSource;
    const currentLocalTrack = getLocalVideoTrack(getState()['features/base/tracks']);

    if (virtualSource?.videoType === VIDEO_TYPE.DESKTOP) {
        localTrackStopped(dispatch, virtualSource, currentLocalTrack?.jitsiTrack);
    }

    return next(action);
});
