import { IStore } from '../app/types';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_SCREENSHARE_CAPTURE_FRAME_RATE, SET_SCREEN_AUDIO_SHARE_STATE } from './actionTypes';
import logger from './logger';

/**
 * Implements the middleware of the feature screen-share.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { getState } = store;
    const state = getState();

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

    case SET_SCREEN_AUDIO_SHARE_STATE: {
        const { isSharingAudio } = action;
        const { participantId } = state['features/large-video'];

        if (isSharingAudio) {
            logger.debug(`User with id: ${participantId} playing audio sharing.`);
            APP.API.notifyAudioOrVideoSharingToggled(MEDIA_TYPE.AUDIO, 'playing', participantId);
        } else {
            logger.debug(`User with id: ${participantId} stop audio sharing.`);
            APP.API.notifyAudioOrVideoSharingToggled(MEDIA_TYPE.AUDIO, 'stop', participantId);
        }
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
function _setScreenshareCaptureFps(store: IStore, frameRate?: number) {
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
