// @flow

import {
    DIAL_OUT_CANCELED,
    DIAL_OUT_CODES_UPDATED,
    DIAL_OUT_SERVICE_FAILED,
    PHONE_NUMBER_CHECKED
} from './actionTypes';

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
export function dial(dialNumber: string) {
    return (dispatch: Dispatch<*>, getState: Function) => {
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
export function checkDialNumber(dialNumber: string) {
    return (dispatch: Dispatch<*>, getState: Function) => {
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
            .then(response =>
                dispatch({
                    type: PHONE_NUMBER_CHECKED,
                    response
                }))
            .catch(error =>
                dispatch({
                    type: DIAL_OUT_SERVICE_FAILED,
                    error
                }));
    };
}

/**
 * Sends an ajax request for dial-out country codes.
 *
 * @returns {Function}
 */
export function updateDialOutCodes() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const { dialOutCodesUrl } = getState()['features/base/config'];

        if (!dialOutCodesUrl) {
            return;
        }

        $.getJSON(dialOutCodesUrl)
            .then(response =>
                dispatch({
                    type: DIAL_OUT_CODES_UPDATED,
                    response
                }))
            .catch(error =>
                dispatch({
                    type: DIAL_OUT_SERVICE_FAILED,
                    error
                }));
    };
}
