import { openDialog } from '../../features/base/dialog';

import {
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import { AddPeopleDialog, InviteDialog } from './components';

declare var $: Function;
declare var APP: Object;

/**
 * Opens the Invite Dialog.
 *
 * @returns {Function}
 */
export function openInviteDialog() {
    return openDialog(InviteDialog);
}

/**
 * Opens the Add People Dialog.
 *
 * @returns {Function}
 */
export function openAddPeopleDialog() {
    return openDialog(AddPeopleDialog);
}

/**
 * Sends AJAX requests for dial-in numbers and conference ID.
 *
 * @returns {Function}
 */
export function updateDialInNumbers() {
    return (dispatch, getState) => {
        const state = getState();
        const { dialInConfCodeUrl, dialInNumbersUrl, hosts }
            = state['features/base/config'];
        const mucURL = hosts && hosts.muc;

        if (!dialInConfCodeUrl || !dialInNumbersUrl || !mucURL) {
            dispatch({
                type: UPDATE_DIAL_IN_NUMBERS_FAILED,
                error: 'URLs for fetching dial in numbers not properly defined'
            });

            return;
        }

        const { room } = state['features/base/conference'];
        const conferenceIDURL
            = `${dialInConfCodeUrl}?conference=${room}@${mucURL}`;

        Promise.all([
            $.getJSON(dialInNumbersUrl),
            $.getJSON(conferenceIDURL)
        ])
            .then(([ dialInNumbers, { conference, id, message } ]) => {
                if (!conference || !id) {
                    return Promise.reject(message);
                }

                dispatch({
                    type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
                    conferenceID: id,
                    dialInNumbers
                });
            })
            .catch(error => {
                dispatch({
                    type: UPDATE_DIAL_IN_NUMBERS_FAILED,
                    error
                });
            });
    };
}
