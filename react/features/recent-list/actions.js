// @flow

import {
    CLEAR_RECENT_LIST,
    DELETE_RECENT_LIST_ENTRY,
    _STORE_CURRENT_CONFERENCE,
    _UPDATE_CONFERENCE_DURATION
} from './actionTypes';

/**
 * Clears the entire recent list.
 *
 * @returns {{
 *     type: CLEAR_RECENT_LIST
 * }}
 */
export function clearRecentList() {
    return {
        type: CLEAR_RECENT_LIST
    };
}

/**
 * Deletes a recent list entry based on url and date.
 *
 * @param {Object} itemId - An object constructed of the url and the date of the
 * item for easy identification.
 * @returns {{}}
 */
export function deleteRecentListEntry(itemId: Object) {
    return {
        type: DELETE_RECENT_LIST_ENTRY,
        itemId
    };
}

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
