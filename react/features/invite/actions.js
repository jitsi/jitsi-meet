// @flow

import {
    BEGIN_ADD_PEOPLE,
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import { getDialInConferenceID, getDialInNumbers } from './functions';

/**
 * Creates a (redux) action to signal that a click/tap has been performed on
 * {@link InviteButton} and that the execution flow for adding/inviting people
 * to the current conference/meeting is to begin.
 *
 * @returns {{
 *     type: BEGIN_ADD_PEOPLE
 * }}
 */
export function beginAddPeople() {
    return {
        type: BEGIN_ADD_PEOPLE
    };
}

/**
 * Sends AJAX requests for dial-in numbers and conference ID.
 *
 * @returns {Function}
 */
export function updateDialInNumbers() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const { dialInConfCodeUrl, dialInNumbersUrl, hosts }
            = state['features/base/config'];
        const mucURL = hosts && hosts.muc;

        if (!dialInConfCodeUrl || !dialInNumbersUrl || !mucURL) {
            // URLs for fetching dial in numbers not defined
            return;
        }

        const { room } = state['features/base/conference'];

        Promise.all([
            getDialInNumbers(dialInNumbersUrl),
            getDialInConferenceID(dialInConfCodeUrl, room, mucURL)
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
