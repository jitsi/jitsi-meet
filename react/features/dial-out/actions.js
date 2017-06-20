import { openDialog } from '../../features/base/dialog';

import {
    DIAL_OUT_CANCELED,
    DIAL_OUT_CODES_UPDATED,
    DIAL_OUT_SERVICE_FAILED,
    PHONE_NUMBER_CHECKED
} from './actionTypes';

import { DialOutDialog } from './components';

declare var $: Function;
declare var config: Object;

/**
 * Dials the given number.
 *
 * @returns {Function}
 */
export function cancel() {
    return {
        type: DIAL_OUT_CANCELED
    };
}

/**
 * Dials the given number.
 *
 * @param {string} dialNumber - The number to dial.
 * @returns {Function}
 */
export function dial(dialNumber) {
    return (dispatch, getState) => {
        const { conference } = getState()['features/base/conference'];

        conference.dial(dialNumber);
    };
}

/**
 * Sends an ajax request for dial-out country codes.
 *
 * @param {string} dialNumber - The dial number to check for validity.
 * @returns {Function}
 */
export function checkDialNumber(dialNumber) {
    return (dispatch, getState) => {
        const { dialOutAuthUrl } = getState()['features/base/config'];

        if (!dialOutAuthUrl) {
            // no auth url, let's say it is valid
            const response = {};

            response.allow = true;
            dispatch({
                type: PHONE_NUMBER_CHECKED,
                response
            });

            return;
        }

        const fullUrl = `${dialOutAuthUrl}?phone=${dialNumber}`;

        $.getJSON(fullUrl)
            .success(response =>
                dispatch({
                    type: PHONE_NUMBER_CHECKED,
                    response
                }))
            .error(error =>
                dispatch({
                    type: DIAL_OUT_SERVICE_FAILED,
                    error
                }));
    };
}


/**
 * Opens the dial-out dialog.
 *
 * @returns {Function}
 */
export function openDialOutDialog() {
    return openDialog(DialOutDialog);
}

/**
 * Sends an ajax request for dial-out country codes.
 *
 * @returns {Function}
 */
export function updateDialOutCodes() {
    return (dispatch, getState) => {
        const { dialOutCodesUrl } = getState()['features/base/config'];

        if (!dialOutCodesUrl) {
            return;
        }

        $.getJSON(dialOutCodesUrl)
            .success(response =>
                dispatch({
                    type: DIAL_OUT_CODES_UPDATED,
                    response
                }))
            .error(error =>
                dispatch({
                    type: DIAL_OUT_SERVICE_FAILED,
                    error
                }));
    };
}
