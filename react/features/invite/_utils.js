// @flow

/**
 * Utility class with no dependencies. Used in components that are stripped in separate bundles
 * and requires as less dependencies as possible.
 */

import { doGetJSON } from '../base/util';

/**
 * Formats the conference pin in readable way for UI to display it.
 * Formats the pin in 3 groups of digits:
 * XXXX XXXX XX or XXXXX XXXXX XXX.
 * The length of first and second group is Math.ceil(pin.length / 3).
 *
 * @param {Object} conferenceID - The conference id to format, string or number.
 * @returns {string} - The formatted conference pin.
 * @private
 */
export function _formatConferenceIDPin(conferenceID: Object) {
    const conferenceIDStr = conferenceID.toString();

    // let's split the conferenceID in 3 parts, to be easier to read
    const partLen = Math.ceil(conferenceIDStr.length / 3);

    return `${
        conferenceIDStr.substring(0, partLen)} ${
        conferenceIDStr.substring(partLen, 2 * partLen)} ${
        conferenceIDStr.substring(2 * partLen, conferenceIDStr.length)}`;
}

/**
 * Sends a GET request to obtain the conference ID necessary for identifying
 * which conference to join after diaing the dial-in service.
 *
 * @param {string} baseUrl - The url for obtaining the conference ID (pin) for
 * dialing into a conference.
 * @param {string} roomName - The conference name to find the associated
 * conference ID.
 * @param {string} mucURL - In which MUC the conference exists.
 * @returns {Promise} - The promise created by the request.
 */
export function getDialInConferenceID(
        baseUrl: string,
        roomName: string,
        mucURL: string
): Promise<Object> {

    const conferenceIDURL = `${baseUrl}?conference=${roomName}@${mucURL}`;

    return doGetJSON(conferenceIDURL, true);
}

/**
 * Sends a GET request for phone numbers used to dial into a conference.
 *
 * @param {string} url - The service that returns conference dial-in numbers.
 * @param {string} roomName - The conference name to find the associated
 * conference ID.
 * @param {string} mucURL - In which MUC the conference exists.
 * @returns {Promise} - The promise created by the request. The returned numbers
 * may be an array of Objects containing numbers, with keys countryCode,
 * tollFree, formattedNumber or an object with countries as keys and arrays of
 * phone number strings, as the second one should not be used and is deprecated.
 */
export function getDialInNumbers(
        url: string,
        roomName: string,
        mucURL: string
): Promise<*> {

    // when roomName and mucURL are available
    // provide conference when looking up dial in numbers

    return doGetJSON(url + (roomName && mucURL ? `?conference=${roomName}@${mucURL}` : ''), true);
}
