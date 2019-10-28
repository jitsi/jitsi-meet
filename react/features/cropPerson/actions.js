// @flow

import { getLocalPresenterTrack,
         getLocalVideoTrack
} from '../../features/base/tracks';

import { CROP_DISABLED, CROP_ENABLED } from './actionTypes';
import { getCropPersonEffect } from './functions';
import logger from './logger';
import UIEvents from '../../../service/UI/UIEvents';

declare var APP: Object;

/**
* Signals the local participant is switching between cropped or non cropped video.
*
* @param {boolean} enabled - If true enables video blur, false otherwise.
* @returns {Promise}
*/
export function toggleCropPersonEffect(enabled: boolean) {
    return function(dispatch: (Object) => Object, getState: () => any) {
        const state = getState();
        const presenterTrack 
            = getLocalPresenterTrack(state['features/base/tracks']);
        const videoTrack
            = getLocalVideoTrack(state['features/base/tracks']);

        // Apply crop effect only when presenter track and video
        // track are present.
        if (!presenterTrack || !videoTrack) {
            logger.debug('Crop can be enabled only in presenter mode');

            return Promise.resolve();
        }

        if (state['features/cropPerson'].cropEnabled === enabled) {

            return Promise.resolve();
        }

        return getCropPersonEffect(presenterTrack.jitsiTrack.stream)
            .then(effect => {
                videoTrack.jitsiTrack.setEffect(enabled ? effect : undefined);
            })
            .catch(error => {
                dispatch(cropDisabled());
                logger.error('getCropPersonEffect failed with error:', error);
            })
            .then(() => {
                enabled ? dispatch(cropEnabled()) : dispatch(cropDisabled());
                if (!enabled) {
                    // turn the presenter effect back on when crop effect is
                    // disabled.
                    typeof APP === 'undefined'
                        || APP.UI.emitEvent(UIEvents.PRESENTER_MUTED, false);
                }
            });
    };
}

/**
 * Signals the local participant that the crop has been enabled.
 *
 * @returns {{
 *      type: CROP_ENABLED
 * }}
 */
export function cropEnabled() {
    return {
        type: CROP_ENABLED
    };
}

/**
 * Signals the local participant that the crop has been disabled.
 *
 * @returns {{
 *      type: CROP_DISABLED
 * }}
 */
export function cropDisabled() {
    return {
        type: CROP_DISABLED
    };
}
