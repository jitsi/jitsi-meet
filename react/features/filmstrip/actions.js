import {
    SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
    SET_FILMSTRIP_VISIBILITY
} from './actionTypes';

import UIEvents from '../../../service/UI/UIEvents';

declare var APP: Object;

/**
 * Sets the visibility of remote videos in the filmstrip.
 *
 * @param {boolean} remoteVideosVisible - Whether or not remote videos in the
 * filmstrip should be visible.
 * @returns {{
 *     type: SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
 *     remoteVideosVisible: boolean
 * }}
 */
export function setFilmstripRemoteVideosVisibility(remoteVideosVisible) {
    return {
        type: SET_FILMSTRIP_REMOTE_VIDEOS_VISIBLITY,
        remoteVideosVisible
    };
}

/**
 * Sets whether or not the entire filmstrip should be visible. Emits out to
 * non-reduxified UI of the filmstrip visibility change.
 *
 * @param {boolean} visible - Whether not the filmstrip is visible.
 * @returns {Function}
 */
export function setFilmstripVisibility(visible) {
    return dispatch => {
        dispatch({
            type: SET_FILMSTRIP_VISIBILITY,
            visible
        });

        if (typeof APP !== 'undefined') {
            APP.UI.emitEvent(UIEvents.TOGGLED_FILMSTRIP, visible);
        }
    };
}
