// @flow

import { doGetJSON } from '../base/util';

declare var $: Function;
declare var interfaceConfig: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
        mucURL: string): Promise<Object> {
    const conferenceIDURL = `${baseUrl}?conference=${roomName}@${mucURL}`;

    return doGetJSON(conferenceIDURL);
}

/**
 * Sends a GET request for phone numbers used to dial into a conference.
 *
 * @param {string} url - The service that returns confernce dial-in numbers.
 * @returns {Promise} - The promise created by the request. The returned numbers
 * may be an array of numbers or an object with countries as keys and arrays of
 * phone number strings.
 */
export function getDialInNumbers(url: string): Promise<*> {
    return doGetJSON(url);
}

/**
 * Get the position of the invite option in the interfaceConfig.INVITE_OPTIONS
 * list.
 *
 * @param {string} name - The invite option name.
 * @private
 * @returns {number} - The position of the option in the list.
 */
export function getInviteOptionPosition(name: string): number {
    return interfaceConfig.INVITE_OPTIONS.indexOf(name);
}

/**
 * Sends a post request to an invite service.
 *
 * @param {string} inviteServiceUrl - The invite service that generates the
 * invitation.
 * @param {string} inviteUrl - The url to the conference.
 * @param {string} jwt - The jwt token to pass to the search service.
 * @param {Immutable.List} inviteItems - The list of the "user" or "room"
 * type items to invite.
 * @returns {Promise} - The promise created by the request.
 */
export function invitePeopleAndChatRooms( // eslint-disable-line max-params
        inviteServiceUrl: string,
        inviteUrl: string,
        jwt: string,
        inviteItems: Array<Object>): Promise<void> {
    if (!inviteItems || inviteItems.length === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        $.post(
                `${inviteServiceUrl}?token=${jwt}`,
                JSON.stringify({
                    'invited': inviteItems,
                    'url': inviteUrl
                }),
                resolve,
                'json')
            .fail((jqxhr, textStatus, error) => reject(error));
    });
}

/**
 * Indicates if an invite option is enabled in the configuration.
 *
 * @param {string} name - The name of the option defined in
 * interfaceConfig.INVITE_OPTIONS.
 * @returns {boolean} - True to indicate that the given invite option is
 * enabled, false - otherwise.
 */
export function isInviteOptionEnabled(name: string) {
    return getInviteOptionPosition(name) !== -1;
}

/**
 * Sends an ajax request to a directory service.
 *
 * @param {string} serviceUrl - The service to query.
 * @param {string} jwt - The jwt token to pass to the search service.
 * @param {string} text - Text to search.
 * @param {Array<string>} queryTypes - Array with the query types that will be
 * executed - "conferenceRooms" | "user" | "room".
 * @returns {Promise} - The promise created by the request.
 */
export function searchDirectory( // eslint-disable-line max-params
        serviceUrl: string,
        jwt: string,
        text: string,
        queryTypes: Array<string> = [ 'conferenceRooms', 'user', 'room' ]
): Promise<Array<Object>> {
    const queryTypesString = JSON.stringify(queryTypes);

    return fetch(`${serviceUrl}?query=${encodeURIComponent(text)}&queryTypes=${
        queryTypesString}&jwt=${jwt}`)
            .then(response => {
                const jsonify = response.json();

                if (response.ok) {
                    return jsonify;
                }

                return jsonify
                    .then(result => Promise.reject(result));
            })
            .catch(error => {
                logger.error(
                    'Error searching directory:', error);

                return Promise.reject(error);
            });
}

/**
 * Sends an ajax request to check if the phone number can be called.
 *
 * @param {string} dialNumber - The dial number to check for validity.
 * @param {string} dialOutAuthUrl - The endpoint to use for checking validity.
 * @returns {Promise} - The promise created by the request.
 */
export function checkDialNumber(
        dialNumber: string, dialOutAuthUrl: string): Promise<Object> {
    if (!dialOutAuthUrl) {
        // no auth url, let's say it is valid
        const response = {
            allow: true,
            phone: `+${dialNumber}`
        };

        return Promise.resolve(response);
    }

    const fullUrl = `${dialOutAuthUrl}?phone=${dialNumber}`;

    return new Promise((resolve, reject) => {
        $.getJSON(fullUrl)
            .then(resolve)
            .catch(reject);
    });
}
