// @flow

import {
    _STORE_CURRENT_CONFERENCE,
    _UPDATE_CONFERENCE_DURATION
} from './actionTypes';

/**
 * Action to initiate a new addition to the list.
 *
 * @param {Object} locationURL - The current location URL.
 * @protected
 * @returns {{
 *     type: _STORE_CURRENT_CONFERENCE,
 *     locationURL: Object
 * }}
 */
export function _storeCurrentConference(locationURL: Object) {
    return {
        type: _STORE_CURRENT_CONFERENCE,
        locationURL
    };
}

/**
 * Action to initiate the update of the duration of the last conference.
 *
 * @param {Object} locationURL - The current location URL.
 * @protected
 * @returns {{
 *     type: _UPDATE_CONFERENCE_DURATION,
 *     locationURL: Object
 * }}
 */
export function _updateConferenceDuration(locationURL: Object) {
    return {
        type: _UPDATE_CONFERENCE_DURATION,
        locationURL
    };
}
