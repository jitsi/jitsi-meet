// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { SET_SCREENSHARE_CAPTURE_FRAME_RATE } from './actionTypes';
import logger from './logger';

/**
 * Implements the middleware of the feature screen-share.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        _setScreenshareCaptureFps(store);
        break;
    }
    case SET_SCREENSHARE_CAPTURE_FRAME_RATE: {
        const { captureFrameRate } = action;

        _setScreenshareCaptureFps(store, captureFrameRate);
        break;
    }
    }

    return result;
});

/**
 * Sets the capture frame rate for screenshare.
 *
 * @param {Store} store - The redux store.
 * @param {number} frameRate - Frame rate to be configured.
 * @private
 * @returns {void}
 */
function _setScreenshareCaptureFps(store, frameRate) {
    const state = store.getState();
    const { conference } = state['features/base/conference'];
    const { captureFrameRate } = state['features/screen-share'];
    const screenShareFps = frameRate ?? captureFrameRate;

    if (!conference) {
        return;
    }

    if (screenShareFps) {
        logger.debug(`Setting screenshare capture frame rate as ${screenShareFps}`);
        conference.setDesktopSharingFrameRate(screenShareFps);
    }

}
