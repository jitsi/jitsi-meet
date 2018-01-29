// @flow

import {
    STORE_CURRENT_CONFERENCE,
    UPDATE_CONFERENCE_DURATION
} from './actionTypes';

/**
 * Action to initiate a new addition to the list.
 *
 * @param {Object} locationURL - The current location URL.
 * @returns {{
 *     type: STORE_CURRENT_CONFERENCE,
 *     locationURL: Object
 * }}
 */
export function storeCurrentConference(locationURL: Object) {
    return {
        type: STORE_CURRENT_CONFERENCE,
        locationURL
    };
}

/**
 * Action to initiate the update of the duration of the last conference.
 *
 * @param {Object} locationURL - The current location URL.
 * @returns {{
 *     type: UPDATE_CONFERENCE_DURATION,
 *     locationURL: Object
 * }}
 */
export function updateConferenceDuration(locationURL: Object) {
    return {
        type: UPDATE_CONFERENCE_DURATION,
        locationURL
    };
}
