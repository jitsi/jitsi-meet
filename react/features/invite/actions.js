import { openDialog } from '../../features/base/dialog';

import {
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_REQUEST,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import { InviteDialog } from './components';

declare var $: Function;
declare var APP: Object;
declare var config: Object;

/**
 * Opens the Invite Dialog.
 *
 * @returns {Function}
 */
export function openInviteDialog() {
    return openDialog(InviteDialog, {
        conferenceUrl: encodeURI(APP.ConferenceUrl.getInviteUrl()),
        dialInNumbersUrl: config.dialInNumbersUrl
    });
}

/**
 * Sends an ajax request for dial-in numbers.
 *
 * @param {string} dialInNumbersUrl - The endpoint for retrieving json that
 * includes numbers for dialing in to a conference.
 * @returns {Function}
 */
export function updateDialInNumbers(dialInNumbersUrl) {
    return dispatch => {
        dispatch({
            type: UPDATE_DIAL_IN_NUMBERS_REQUEST
        });

        $.getJSON(dialInNumbersUrl)
            .success(response =>
                dispatch({
                    type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
                    response
                }))
            .error(error =>
                dispatch({
                    type: UPDATE_DIAL_IN_NUMBERS_FAILED,
                    error
                }));
    };
}
