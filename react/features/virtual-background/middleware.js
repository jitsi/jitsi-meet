// @flow

import { JitsiTrackEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { getLocalVideoTrack } from '../base/tracks';

import { toggleBackgroundEffect } from './actions';

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

    if (virtualSource?.videoType === 'desktop') {
        const noneOptions = {
            enabled: false,
            backgroundType: 'none',
            selectedThumbnail: 'none',
            backgroundEffectEnabled: false
        };

        virtualSource
            && virtualSource.on(JitsiTrackEvents.LOCAL_TRACK_STOPPED, () => {
                dispatch(toggleBackgroundEffect(noneOptions, currentLocalTrack.jitsiTrack));
            });
    }

    return next(action);
});
