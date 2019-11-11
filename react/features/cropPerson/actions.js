// @flow

import { getLocalPresenterTrack,
    getLocalVideoTrack
} from '../../features/base/tracks';
import UIEvents from '../../../service/UI/UIEvents';

import { SET_CROP_ENABLED } from './actionTypes';
import { getCropPersonEffect } from './functions';
import logger from './logger';

declare var APP: Object;

/**
* Signals the local participant is switching between cropped or non cropped video.
*
* @param {boolean} enabled - If true enables video crop, false otherwise.
* @returns {Promise}
*/
export function toggleCropPersonEffect(enabled: boolean) {
    return async function(dispatch: (Object) => Object, getState: () => any) {
        const state = getState();
        const presenterTrack
            = getLocalPresenterTrack(state['features/base/tracks']);
        const videoTrack
            = getLocalVideoTrack(state['features/base/tracks']);

        // Apply crop effect only when both presenter and desktop
        // trakcs are present.
        if (!presenterTrack || !videoTrack) {
            logger.debug('Crop can be enabled only in presenter mode');

            return;
        }
        if (state['features/cropPerson'].cropEnabled === enabled) {

            return;
        }
        const effect = await getCropPersonEffect(presenterTrack.jitsiTrack.stream);

        videoTrack.jitsiTrack.setEffect(enabled ? effect : undefined)
            .then(() => {
                dispatch(setCropEnabled(enabled));

                // turn the presenter effect back on when crop effect is
                // disabled.
                if (!enabled) {
                    typeof APP === 'undefined'
                        || APP.UI.emitEvent(UIEvents.PRESENTER_MUTED, false);
                }
            })
            .catch(error => {
                logger.error('setEffect failed with error:', error);
            });
    };
}

/**
 * Signals the local participant that the crop has been enabled or disabled.
 *
 * @param {boolean} enabled - True if crop is to be marked as enabled or false
 * if crop is to be marked as disabled.
 * @returns {{
 *      type: SET_CROP_ENABLED,
 *      enabled: boolean
 * }}
 */
export function setCropEnabled(enabled: boolean) {

    return {
        type: SET_CROP_ENABLED,
        enabled
    };
}

