import { openDialog } from '../../features/base/dialog';

import {
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';
import { InviteDialog } from './components';

declare var $: Function;
declare var APP: Object;
declare var config: Object;

const CONFERENCE_ID_ENDPOINT = config.conferenceMapperUrl;
const DIAL_IN_NUMBERS_ENDPOINT = config.dialInNumbersUrl;
const MUC_URL = config && config.hosts && config.hosts.muc;

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

        if (!CONFERENCE_ID_ENDPOINT || !DIAL_IN_NUMBERS_ENDPOINT || !MUC_URL) {
            return;
        }

        const { room } = getState()['features/base/conference'];
        const conferenceIdUrl
            = `${CONFERENCE_ID_ENDPOINT}?conference=${room}@${MUC_URL}`;

        Promise.all([
            $.getJSON(DIAL_IN_NUMBERS_ENDPOINT),
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
