// @flow

import { getLocalParticipant, PARTICIPANT_ROLE } from '../base/participants';
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
function invitePeopleAndChatRooms( // eslint-disable-line max-params
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
    const query = encodeURIComponent(text);
    const queryTypesString = encodeURIComponent(JSON.stringify(queryTypes));

    return fetch(`${serviceUrl}?query=${query}&queryTypes=${
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
 * RegExp to use to determine if some text might be a phone number.
 *
 * @returns {RegExp}
 */
function isPhoneNumberRegex(): RegExp {
    let regexString = '^[0-9+()-\\s]*$';

    if (typeof interfaceConfig !== 'undefined') {
        regexString = interfaceConfig.PHONE_NUMBER_REGEX || regexString;
    }

    return new RegExp(regexString);
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

/**
 * Removes all non-numeric characters from a string.
 *
 * @param {string} text - The string from which to remove all characters
 * except numbers.
 * @private
 * @returns {string} A string with only numbers.
 */
function getDigitsOnly(text: string = ''): string {
    return text.replace(/\D/g, '');
}

/**
 * Type of the options to use when sending a search query.
 */
export type GetInviteResultsOptions = {

    /**
     * The endpoint to use for checking phone number validity.
     */
    dialOutAuthUrl: string,

    /**
     * Whether or not to search for people.
     */
    enableAddPeople: boolean,

    /**
     * Whether or not to check phone numbers.
     */
    enableDialOut: boolean,

    /**
     * Array with the query types that will be executed -
     * "conferenceRooms" | "user" | "room".
     */
    peopleSearchQueryTypes: Array<string>,

    /**
     * The url to query for people.
     */
    peopleSearchUrl: string,

    /**
     * The jwt token to pass to the search service.
     */
    jwt: string
};

/**
 * Combines directory search with phone number validation to produce a single
 * set of invite search results.
 *
 * @param  {string} query - Text to search.
 * @param  {GetInviteResultsOptions} options - Options to use when searching.
 * @returns {Promise<*>}
 */
export function getInviteResultsForQuery(
        query: string,
        options: GetInviteResultsOptions): Promise<*> {
    const text = query.trim();

    const {
        dialOutAuthUrl,
        enableAddPeople,
        enableDialOut,
        peopleSearchQueryTypes,
        peopleSearchUrl,
        jwt
    } = options;

    let peopleSearchPromise;

    if (enableAddPeople && text) {
        peopleSearchPromise = searchDirectory(
            peopleSearchUrl,
            jwt,
            text,
            peopleSearchQueryTypes);
    } else {
        peopleSearchPromise = Promise.resolve([]);
    }


    const hasCountryCode = text.startsWith('+');
    let phoneNumberPromise;

    if (enableDialOut && isMaybeAPhoneNumber(text)) {
        let numberToVerify = text;

        // When the number to verify does not start with a +, we assume no
        // proper country code has been entered. In such a case, prepend 1
        // for the country code. The service currently takes care of
        // prepending the +.
        if (!hasCountryCode && !text.startsWith('1')) {
            numberToVerify = `1${numberToVerify}`;
        }

        // The validation service works properly when the query is digits
        // only so ensure only digits get sent.
        numberToVerify = getDigitsOnly(numberToVerify);

        phoneNumberPromise
            = checkDialNumber(numberToVerify, dialOutAuthUrl);
    } else {
        phoneNumberPromise = Promise.resolve({});
    }

    return Promise.all([ peopleSearchPromise, phoneNumberPromise ])
        .then(([ peopleResults, phoneResults ]) => {
            const results = [
                ...peopleResults
            ];

            /**
             * This check for phone results is for the day the call to
             * searching people might return phone results as well. When
             * that day comes this check will make it so the server checks
             * are honored and the local appending of the number is not
             * done. The local appending of the phone number can then be
             * cleaned up when convenient.
             */
            const hasPhoneResult = peopleResults.find(
                result => result.type === 'phone');

            if (!hasPhoneResult
                    && typeof phoneResults.allow === 'boolean') {
                results.push({
                    allowed: phoneResults.allow,
                    country: phoneResults.country,
                    type: 'phone',
                    number: phoneResults.phone,
                    originalEntry: text,
                    showCountryCodeReminder: !hasCountryCode
                });
            }

            return results;
        });
}

/**
 * Checks whether a string looks like it could be for a phone number.
 *
 * @param {string} text - The text to check whether or not it could be a
 * phone number.
 * @private
 * @returns {boolean} True if the string looks like it could be a phone
 * number.
 */
function isMaybeAPhoneNumber(text: string): boolean {
    if (!isPhoneNumberRegex().test(text)) {
        return false;
    }

    const digits = getDigitsOnly(text);

    return Boolean(digits.length);
}

/**
 * Type of the options to use when sending invites.
 */
export type SendInvitesOptions = {

    /**
     * Conference object used to dial out.
     */
    conference: Object,

    /**
     * The URL to send invites through.
     */
    inviteServiceUrl: string,

    /**
     * The URL sent with each invite.
     */
    inviteUrl: string,

    /**
     * The function to use to invite video rooms.
     *
     * @param  {Object} The conference to which the video rooms should be
     * invited.
     * @param  {Array<Object>} The list of rooms that should be invited.
     * @returns {void}
     */
    inviteVideoRooms: (Object, Array<Object>) => void,

    /**
     * The jwt token to pass to the invite service.
     */
    jwt: string
};

/**
 * Send invites for a list of items (may be a combination of users, rooms, phone
 * numbers, and video rooms).
 *
 * @param  {Array<Object>} invites - Items for which invites should be sent.
 * @param  {SendInvitesOptions} options - Options to use when sending the
 * provided invites.
 * @returns {Promise} Promise containing the list of invites that were not sent.
 */
export function sendInvitesForItems(
        invites: Array<Object>,
        options: SendInvitesOptions
): Promise<Array<Object>> {

    const {
        conference,
        inviteServiceUrl,
        inviteUrl,
        inviteVideoRooms,
        jwt
    } = options;

    let allInvitePromises = [];
    let invitesLeftToSend = [ ...invites ];

    // First create all promises for dialing out.
    if (conference) {
        const phoneNumbers = invitesLeftToSend.filter(
            item => item.type === 'phone');

        // For each number, dial out. On success, remove the number from
        // {@link invitesLeftToSend}.
        const phoneInvitePromises = phoneNumbers.map(item => {
            const numberToInvite = getDigitsOnly(item.number);

            return conference.dial(numberToInvite)
                    .then(() => {
                        invitesLeftToSend
                            = invitesLeftToSend.filter(invite =>
                                invite !== item);
                    })
                    .catch(error => logger.error(
                        'Error inviting phone number:', error));

        });

        allInvitePromises = allInvitePromises.concat(phoneInvitePromises);
    }

    const usersAndRooms = invitesLeftToSend.filter(item =>
        item.type === 'user' || item.type === 'room');

    if (usersAndRooms.length) {
        // Send a request to invite all the rooms and users. On success,
        // filter all rooms and users from {@link invitesLeftToSend}.
        const peopleInvitePromise = invitePeopleAndChatRooms(
            inviteServiceUrl,
            inviteUrl,
            jwt,
            usersAndRooms)
            .then(() => {
                invitesLeftToSend = invitesLeftToSend.filter(item =>
                    item.type !== 'user' && item.type !== 'room');
            })
            .catch(error => logger.error(
                'Error inviting people:', error));

        allInvitePromises.push(peopleInvitePromise);
    }

    // Sipgw calls are fire and forget. Invite them to the conference
    // then immediately remove them from {@link invitesLeftToSend}.
    const vrooms = invitesLeftToSend.filter(item =>
        item.type === 'videosipgw');

    conference
        && vrooms.length > 0
        && inviteVideoRooms(conference, vrooms);

    invitesLeftToSend = invitesLeftToSend.filter(item =>
        item.type !== 'videosipgw');

    return Promise.all(allInvitePromises)
        .then(() => invitesLeftToSend);
}

/**
 * Determines if adding people is currently enabled.
 *
 * @param {boolean} state - Current state.
 * @returns {boolean} Indication of whether adding people is currently enabled.
 */
export function isAddPeopleEnabled(state: Object): boolean {
    const { app } = state['features/app'];
    const { isGuest } = state['features/base/jwt'];

    return !isGuest && Boolean(app && app.props.addPeopleEnabled);
}

/**
 * Determines if dial out is currently enabled or not.
 *
 * @param {boolean} state - Current state.
 * @returns {boolean} Indication of whether dial out is currently enabled.
 */
export function isDialOutEnabled(state: Object): boolean {
    const { conference } = state['features/base/conference'];
    const { isGuest } = state['features/base/jwt'];
    const { enableUserRolesBasedOnToken } = state['features/base/config'];
    const participant = getLocalParticipant(state);

    return participant && participant.role === PARTICIPANT_ROLE.MODERATOR
                && conference && conference.isSIPCallingSupported()
                && (!enableUserRolesBasedOnToken || !isGuest);
}
