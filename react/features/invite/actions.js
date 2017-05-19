import { openDialog } from '../../features/base/dialog';

import {
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import { InviteDialog } from './components';

declare var $: Function;
declare var APP: Object;

/**
 * Opens the Invite Dialog.
 *
 * @returns {Function}
 */
export function openInviteDialog() {
    return openDialog(InviteDialog, {
        conferenceUrl: encodeURI(APP.ConferenceUrl.getInviteUrl())
    });
}

/**
 * Sends an ajax requests for dial-in numbers and conference id.
 *
 * @returns {Function}
 */
export function updateDialInNumbers() {
    return (dispatch, getState) => {
        const { dialInConfCodeUrl, dialInNumbersUrl, hosts }
            = getState()['features/base/config'];
        const mucUrl = hosts && hosts.muc;

        if (!dialInConfCodeUrl || !dialInNumbersUrl || !mucUrl) {
            dispatch({
                type: UPDATE_DIAL_IN_NUMBERS_FAILED,
                error: 'URLs for fetching dial in numbers not properly defined'
            });

            return;
        }

        const { room } = getState()['features/base/conference'];
        const conferenceIdUrl
            = `${dialInConfCodeUrl}?conference=${room}@${mucUrl}`;

        Promise.all([
            $.getJSON(dialInNumbersUrl),
            $.getJSON(conferenceIdUrl)
        ]).then(([ numbersResponse, idResponse ]) => {
            if (!idResponse.conference || !idResponse.id) {
                return Promise.reject(idResponse.message);
            }

            dispatch({
                type: UPDATE_DIAL_IN_NUMBERS_SUCCESS,
                conferenceId: idResponse,
                dialInNumbers: numbersResponse
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
