import {
    DELETE_RECENT_LIST_ENTRY,
    _STORE_CURRENT_CONFERENCE,
    _UPDATE_CONFERENCE_DURATION
} from './actionTypes';

/**
 * Deletes a recent list entry based on url and date.
 *
 * @param {Object} entryId - An object constructed of the url and the date of
 * the entry for easy identification.
 * @returns {{
 *     type: DELETE_RECENT_LIST_ENTRY,
 *     entryId: Object
 * }}
 */
export function deleteRecentListEntry(entryId: Object) {
    return {
        type: DELETE_RECENT_LIST_ENTRY,
        entryId
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
