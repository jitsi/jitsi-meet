import { openDialog } from '../../features/base/dialog';

import {
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import { InviteDialog } from './components';

declare var $: Function;
declare var APP: Object;
declare var config: Object;

/**
 * The url for the api that matches a conference name and muc to an id.
 *
 * @type {string}
 */
const DIAL_IN_CONF_CODE_URL = config.dialInConfCodeUrl;

/**
 * The url for the api that returns phone numbers to dial in to the conference
 * and join using the conference id.
 *
 * @type {string}
 */
const DIAL_IN_NUMBERS_URLS = config.dialInNumbersUrl;

/**
 * The url for the MUC component joined for the conference.
 *
 * @type {string}
 */
const MUC_URL = config.hosts && config.hosts.muc;

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

        if (!DIAL_IN_CONF_CODE_URL || !DIAL_IN_NUMBERS_URLS || !MUC_URL) {
            dispatch({
                type: UPDATE_DIAL_IN_NUMBERS_FAILED,
                error: 'URLs for fetching dial in numbers not properly defined'
            });

            return;
        }

        const { room } = getState()['features/base/conference'];
        const conferenceIdUrl
            = `${DIAL_IN_CONF_CODE_URL}?conference=${room}@${MUC_URL}`;

        Promise.all([
            $.getJSON(DIAL_IN_NUMBERS_URLS),
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
