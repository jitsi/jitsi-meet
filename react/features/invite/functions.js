// @flow

import { getActiveSession } from '../../features/recording/functions';
import { getRoomName } from '../base/conference';
import { getInviteURL } from '../base/connection';
import { i18next } from '../base/i18n';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import { getLocalParticipant, isLocalParticipantModerator } from '../base/participants';
import { toState } from '../base/redux';
import { doGetJSON, parseURIString } from '../base/util';
import { isVpaasMeeting } from '../billing-counter/functions';

import { SIP_ADDRESS_REGEX } from './constants';
import logger from './logger';

declare var $: Function;
declare var interfaceConfig: Object;

/**
 * Sends an ajax request to check if the phone number can be called.
 *
 * @param {string} dialNumber - The dial number to check for validity.
 * @param {string} dialOutAuthUrl - The endpoint to use for checking validity.
 * @returns {Promise} - The promise created by the request.
 */
export function checkDialNumber(
        dialNumber: string,
        dialOutAuthUrl: string
): Promise<Object> {
    const fullUrl = `${dialOutAuthUrl}?phone=${dialNumber}`;

    return new Promise((resolve, reject) => {
        $.getJSON(fullUrl)
            .then(resolve)
            .catch(reject);
    });
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

    const fullUrl = `${url}?conference=${roomName}@${mucURL}`;

    return doGetJSON(fullUrl, true);
}

/**
 * Removes all non-numeric characters from a string.
 *
 * @param {string} text - The string from which to remove all characters except
 * numbers.
 * @returns {string} A string with only numbers.
 */
export function getDigitsOnly(text: string = ''): string {
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
    addPeopleEnabled: boolean,

    /**
     * Whether or not to check phone numbers.
     */
    dialOutEnabled: boolean,

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
     * Whether or not to check sip invites.
     */
    sipInviteEnabled: boolean,

    /**
     * The jwt token to pass to the search service.
     */
    jwt: string
};

/**
 * Combines directory search with phone number validation to produce a single
 * set of invite search results.
 *
 * @param {string} query - Text to search.
 * @param {GetInviteResultsOptions} options - Options to use when searching.
 * @returns {Promise<*>}
 */
export function getInviteResultsForQuery(
        query: string,
        options: GetInviteResultsOptions
): Promise<*> {

    const text = query.trim();

    const {
        dialOutAuthUrl,
        addPeopleEnabled,
        dialOutEnabled,
        peopleSearchQueryTypes,
        peopleSearchUrl,
        sipInviteEnabled,
        jwt
    } = options;

    let peopleSearchPromise;

    if (addPeopleEnabled && text) {
        peopleSearchPromise = searchDirectory(
            peopleSearchUrl,
            jwt,
            text,
            peopleSearchQueryTypes);
    } else {
        peopleSearchPromise = Promise.resolve([]);
    }


    let hasCountryCode = text.startsWith('+');
    let phoneNumberPromise;

    // Phone numbers are handled a specially to enable both cases of restricting
    // numbers to telephone number-y numbers and accepting any arbitrary string,
    // which may be valid for SIP (jigasi) calls. If the dialOutAuthUrl is
    // defined, then it is assumed the call is to a telephone number and
    // some validation of the number is completed, with the + sign used as a way
    // for the UI to detect and enforce the usage of a country code. If the
    // dialOutAuthUrl is not defined, accept anything because this is assumed
    // to be the SIP (jigasi) case.
    if (dialOutEnabled && dialOutAuthUrl && isMaybeAPhoneNumber(text)) {
        let numberToVerify = text;

        // When the number to verify does not start with a +, we assume no
        // proper country code has been entered. In such a case, prepend 1 for
        // the country code. The service currently takes care of prepending the
        // +.
        if (!hasCountryCode && !text.startsWith('1')) {
            numberToVerify = `1${numberToVerify}`;
        }

        // The validation service works properly when the query is digits only
        // so ensure only digits get sent.
        numberToVerify = getDigitsOnly(numberToVerify);

        phoneNumberPromise = checkDialNumber(numberToVerify, dialOutAuthUrl);
    } else if (dialOutEnabled && !dialOutAuthUrl) {
        // fake having a country code to hide the country code reminder
        hasCountryCode = true;

        // With no auth url, let's say the text is a valid number
        phoneNumberPromise = Promise.resolve({
            allow: true,
            country: '',
            phone: text
        });
    } else {
        phoneNumberPromise = Promise.resolve({});
    }

    return Promise.all([ peopleSearchPromise, phoneNumberPromise ])
        .then(([ peopleResults, phoneResults ]) => {
            const results = [
                ...peopleResults
            ];

            /**
             * This check for phone results is for the day the call to searching
             * people might return phone results as well. When that day comes
             * this check will make it so the server checks are honored and the
             * local appending of the number is not done. The local appending of
             * the phone number can then be cleaned up when convenient.
             */
            const hasPhoneResult
                = peopleResults.find(result => result.type === 'phone');

            if (!hasPhoneResult && typeof phoneResults.allow === 'boolean') {
                results.push({
                    allowed: phoneResults.allow,
                    country: phoneResults.country,
                    type: 'phone',
                    number: phoneResults.phone,
                    originalEntry: text,
                    showCountryCodeReminder: !hasCountryCode
                });
            }

            if (sipInviteEnabled && isASipAddress(text)) {
                results.push({
                    type: 'sip',
                    address: text
                });
            }

            return results;
        });
}

/**
 * Creates a message describing how to dial in to the conference.
 *
 * @returns {string}
 */
export function getInviteText({
    state,
    phoneNumber,
    t
}: Object) {
    const dialIn = state['features/invite'];
    const inviteUrl = getInviteURL(state);
    const currentLiveStreamingSession = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);
    const liveStreamViewURL
        = currentLiveStreamingSession
            && currentLiveStreamingSession.liveStreamViewURL;
    const localParticipant = getLocalParticipant(state);
    const localParticipantName = localParticipant?.name;

    const inviteURL = _decodeRoomURI(inviteUrl);

    let invite = localParticipantName
        ? t('info.inviteURLFirstPartPersonal', { name: localParticipantName })
        : t('info.inviteURLFirstPartGeneral');

    invite += t('info.inviteURLSecondPart', {
        url: inviteURL
    });

    if (liveStreamViewURL) {
        const liveStream = t('info.inviteLiveStream', {
            url: liveStreamViewURL
        });

        invite = `${invite}\n${liveStream}`;
    }

    if (shouldDisplayDialIn(dialIn)) {
        const dial = t('info.invitePhone', {
            number: phoneNumber,
            conferenceID: dialIn.conferenceID
        });
        const moreNumbers = t('info.invitePhoneAlternatives', {
            url: getDialInfoPageURL(state),
            silentUrl: `${inviteURL}#config.startSilent=true`
        });

        invite = `${invite}\n${dial}\n${moreNumbers}`;
    }

    return invite;
}

/**
 * Helper for determining how many of each type of user is being invited. Used
 * for logging and sending analytics related to invites.
 *
 * @param {Array} inviteItems - An array with the invite items, as created in
 * {@link _parseQueryResults}.
 * @returns {Object} An object with keys as user types and values as the number
 * of invites for that type.
 */
export function getInviteTypeCounts(inviteItems: Array<Object> = []) {
    const inviteTypeCounts = {};

    inviteItems.forEach(({ type }) => {
        if (!inviteTypeCounts[type]) {
            inviteTypeCounts[type] = 0;
        }
        inviteTypeCounts[type]++;
    });

    return inviteTypeCounts;
}

/**
 * Sends a post request to an invite service.
 *
 * @param {string} inviteServiceUrl - The invite service that generates the
 * invitation.
 * @param {string} inviteUrl - The url to the conference.
 * @param {string} jwt - The jwt token to pass to the search service.
 * @param {Immutable.List} inviteItems - The list of the "user" or "room" type
 * items to invite.
 * @returns {Promise} - The promise created by the request.
 */
export function invitePeopleAndChatRooms( // eslint-disable-line max-params
        inviteServiceUrl: string,
        inviteUrl: string,
        jwt: string,
        inviteItems: Array<Object>
): Promise<void> {

    if (!inviteItems || inviteItems.length === 0) {
        return Promise.resolve();
    }

    return fetch(
           `${inviteServiceUrl}?token=${jwt}`,
           {
               body: JSON.stringify({
                   'invited': inviteItems,
                   'url': inviteUrl
               }),
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
               }
           }
    );
}

/**
 * Determines if adding people is currently enabled.
 *
 * @param {boolean} state - Current state.
 * @returns {boolean} Indication of whether adding people is currently enabled.
 */
export function isAddPeopleEnabled(state: Object): boolean {
    const { peopleSearchUrl } = state['features/base/config'];

    return state['features/base/jwt'].jwt && Boolean(peopleSearchUrl) && !isVpaasMeeting(state);
}

/**
 * Determines if dial out is currently enabled or not.
 *
 * @param {boolean} state - Current state.
 * @returns {boolean} Indication of whether dial out is currently enabled.
 */
export function isDialOutEnabled(state: Object): boolean {
    const { conference } = state['features/base/conference'];

    return isLocalParticipantModerator(state)
        && conference && conference.isSIPCallingSupported();
}

/**
 * Determines if inviting sip endpoints is enabled or not.
 *
 * @param {Object} state - Current state.
 * @returns {boolean} Indication of whether dial out is currently enabled.
 */
export function isSipInviteEnabled(state: Object): boolean {
    const { sipInviteUrl } = state['features/base/config'];
    const { features = {} } = getLocalParticipant(state);

    return state['features/base/jwt'].jwt
        && Boolean(sipInviteUrl)
        && String(features['sip-outbound-call']) === 'true';
}

/**
 * Checks whether a string looks like it could be for a phone number.
 *
 * @param {string} text - The text to check whether or not it could be a phone
 * number.
 * @private
 * @returns {boolean} True if the string looks like it could be a phone number.
 */
function isMaybeAPhoneNumber(text: string): boolean {
    if (!isPhoneNumberRegex().test(text)) {
        return false;
    }

    const digits = getDigitsOnly(text);

    return Boolean(digits.length);
}

/**
 * Checks whether a string matches a sip address format.
 *
 * @param {string} text - The text to check.
 * @returns {boolean} True if provided text matches a sip address format.
 */
function isASipAddress(text: string): boolean {
    return SIP_ADDRESS_REGEX.test(text);
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
 * Returns descriptive text that can be used to invite participants to a meeting
 * (share via mobile or use it for calendar event description).
 *
 * @param {Object} state - The current state.
 * @param {string} inviteUrl - The conference/location URL.
 * @param {boolean} useHtml - Whether to return html text.
 * @returns {Promise<string>} A {@code Promise} resolving with a
 * descriptive text that can be used to invite participants to a meeting.
 */
export function getShareInfoText(
        state: Object, inviteUrl: string, useHtml: ?boolean): Promise<string> {
    let roomUrl = _decodeRoomURI(inviteUrl);
    const includeDialInfo = state['features/base/config'] !== undefined;

    if (useHtml) {
        roomUrl = `<a href="${roomUrl}">${roomUrl}</a>`;
    }

    let infoText = i18next.t('share.mainText', { roomUrl });

    if (includeDialInfo) {
        const { room } = parseURIString(inviteUrl);
        let numbersPromise;

        if (state['features/invite'].numbers
            && state['features/invite'].conferenceID) {
            numbersPromise = Promise.resolve(state['features/invite']);
        } else {
            // we are requesting numbers and conferenceId directly
            // not using updateDialInNumbers, because custom room
            // is specified and we do not want to store the data
            // in the state
            const { dialInConfCodeUrl, dialInNumbersUrl, hosts }
                = state['features/base/config'];
            const mucURL = hosts && hosts.muc;

            if (!dialInConfCodeUrl || !dialInNumbersUrl || !mucURL) {
                // URLs for fetching dial in numbers not defined
                return Promise.resolve(infoText);
            }

            numbersPromise = Promise.all([
                getDialInNumbers(dialInNumbersUrl, room, mucURL),
                getDialInConferenceID(dialInConfCodeUrl, room, mucURL)
            ]).then(([ numbers, {
                conference, id, message } ]) => {

                if (!conference || !id) {
                    return Promise.reject(message);
                }

                return {
                    numbers,
                    conferenceID: id
                };
            });
        }

        return numbersPromise.then(
            ({ conferenceID, numbers }) => {
                const phoneNumber = _getDefaultPhoneNumber(numbers) || '';

                return `${
                    i18next.t('info.dialInNumber')} ${
                    phoneNumber} ${
                    i18next.t('info.dialInConferenceID')} ${
                    conferenceID}#\n\n`;
            })
            .catch(error =>
                logger.error('Error fetching numbers or conferenceID', error))
            .then(defaultDialInNumber => {
                let dialInfoPageUrl = getDialInfoPageURL(state);

                if (useHtml) {
                    dialInfoPageUrl
                        = `<a href="${dialInfoPageUrl}">${dialInfoPageUrl}</a>`;
                }

                infoText += i18next.t('share.dialInfoText', {
                    defaultDialInNumber,
                    dialInfoPageUrl });

                return infoText;
            });
    }

    return Promise.resolve(infoText);
}

/**
 * Generates the URL for the static dial in info page.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {string}
 */
export function getDialInfoPageURL(state: Object) {
    const { didPageUrl } = state['features/dynamic-branding'];
    const conferenceName = getRoomName(state);
    const { locationURL } = state['features/base/connection'];
    const { href } = locationURL;
    const room = _decodeRoomURI(conferenceName);

    const url = didPageUrl || `${href.substring(0, href.lastIndexOf('/'))}/static/dialInInfo.html`;

    return `${url}?room=${room}`;
}

/**
 * Generates the URL for the static dial in info page.
 *
 * @param {string} uri - The conference URI string.
 * @returns {string}
 */
export function getDialInfoPageURLForURIString(
        uri: ?string) {
    if (!uri) {
        return undefined;
    }
    const { protocol, host, contextRoot, room } = parseURIString(uri);

    return `${protocol}//${host}${contextRoot}static/dialInInfo.html?room=${room}`;
}

/**
 * Returns whether or not dial-in related UI should be displayed.
 *
 * @param {Object} dialIn - Dial in information.
 * @returns {boolean}
 */
export function shouldDisplayDialIn(dialIn: Object) {
    const { conferenceID, numbers, numbersEnabled } = dialIn;
    const phoneNumber = _getDefaultPhoneNumber(numbers);

    return Boolean(
            conferenceID
            && numbers
            && numbersEnabled
            && phoneNumber);
}

/**
 * Returns if multiple dial-in numbers are available.
 *
 * @param {Array<string>|Object} dialInNumbers - The array or object of
 * numbers to check.
 * @private
 * @returns {boolean}
 */
export function hasMultipleNumbers(dialInNumbers: ?Object) {
    if (!dialInNumbers) {
        return false;
    }

    if (Array.isArray(dialInNumbers)) {
        return dialInNumbers.length > 1;
    }

    // deprecated and will be removed
    const { numbers } = dialInNumbers;

    // eslint-disable-next-line no-confusing-arrow
    return Boolean(numbers && Object.values(numbers).map(a => Array.isArray(a) ? a.length : 0)
        .reduce((a, b) => a + b) > 1);
}

/**
 * Sets the internal state of which dial-in number to display.
 *
 * @param {Array<string>|Object} dialInNumbers - The array or object of
 * numbers to choose a number from.
 * @private
 * @returns {string|null}
 */
export function _getDefaultPhoneNumber(
        dialInNumbers: ?Object): ?string {

    if (!dialInNumbers) {
        return null;
    }

    if (Array.isArray(dialInNumbers)) {
        // new syntax follows
        // find the default country inside dialInNumbers, US one
        // or return the first one
        const defaultNumber = dialInNumbers.find(number => number.default);

        if (defaultNumber) {
            return defaultNumber.formattedNumber;
        }

        return dialInNumbers.length > 0
            ? dialInNumbers[0].formattedNumber : null;
    }

    const { numbers } = dialInNumbers;

    if (numbers && Object.keys(numbers).length > 0) {
        // deprecated and will be removed
        const firstRegion = Object.keys(numbers)[0];

        return firstRegion && numbers[firstRegion][0];
    }

    return null;
}

/**
 * Decodes URI only if doesn't contain a space(' ').
 *
 * @param {string} url - The string to decode.
 * @returns {string} - It the string contains space, encoded value is '%20' returns
 * same string, otherwise decoded one.
 * @private
 */
export function _decodeRoomURI(url: string) {
    let roomUrl = url;

    // we want to decode urls when the do not contain space, ' ', which url encoded is %20
    if (roomUrl && !roomUrl.includes('%20')) {
        roomUrl = decodeURI(roomUrl);
    }

    // Handles a special case where the room name has % encoded, the decoded will have
    // % followed by a char (non-digit) which is not a valid URL and room name ... so we do not
    // want to show this decoded
    if (roomUrl.match(/.*%[^\d].*/)) {
        return url;
    }

    return roomUrl;
}

/**
 * Returns the stored conference id.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {string}
 */
export function getConferenceId(stateful: Object | Function) {
    return toState(stateful)['features/invite'].conferenceID;
}

/**
 * Returns the default dial in number from the store.
 *
 * @param {Object | Function} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {string | null}
 */
export function getDefaultDialInNumber(stateful: Object | Function) {
    return _getDefaultPhoneNumber(toState(stateful)['features/invite'].numbers);
}

/**
 * Executes the dial out request.
 *
 * @param {string} url - The url for dialing out.
 * @param {Object} body - The body of the request.
 * @param {string} reqId - The unique request id.
 * @returns {Object}
 */
export async function executeDialOutRequest(url: string, body: Object, reqId: string) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'request-id': reqId
        },
        body: JSON.stringify(body)
    });

    const json = await res.json();

    return res.ok ? json : Promise.reject(json);
}

/**
 * Executes the dial out status request.
 *
 * @param {string} url - The url for dialing out.
 * @param {string} reqId - The unique request id used on the dial out request.
 * @returns {Object}
 */
export async function executeDialOutStatusRequest(url: string, reqId: string) {
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'request-id': reqId
        }
    });

    const json = await res.json();

    return res.ok ? json : Promise.reject(json);
}

export const sharingFeatures = {
    email: 'email',
    url: 'url',
    dialIn: 'dial-in',
    embed: 'embed'
};

/**
 * Returns true if a specific sharing feature is enabled in interface configuration.
 *
 * @param {string} sharingFeature - The sharing feature to check.
 * @returns {boolean}
 */
export function isSharingEnabled(sharingFeature: string) {
    return typeof interfaceConfig === 'undefined'
        || typeof interfaceConfig.SHARING_FEATURES === 'undefined'
        || (interfaceConfig.SHARING_FEATURES.length && interfaceConfig.SHARING_FEATURES.indexOf(sharingFeature) > -1);
}

/**
 * Sends a post request to an invite service.
 *
 * @param {Array} inviteItems - The list of the "sip" type items to invite.
 * @param {URL} locationURL - The URL of the location.
 * @param {string} sipInviteUrl - The invite service that generates the invitation.
 * @param {string} jwt - The jwt token.
 * @param {string} roomName - The name to the conference.
 * @param {string} displayName - The user display name.
 * @returns {Promise} - The promise created by the request.
 */
export function inviteSipEndpoints( // eslint-disable-line max-params
        inviteItems: Array<Object>,
        locationURL: URL,
        sipInviteUrl: string,
        jwt: string,
        roomName: string,
        displayName: string
): Promise<void> {
    if (inviteItems.length === 0) {
        return Promise.resolve();
    }

    const baseUrl = Object.assign(new URL(locationURL.toString()), {
        pathname: locationURL.pathname.replace(`/${roomName}`, ''),
        search: ''
    });

    return fetch(
       sipInviteUrl,
       {
           body: JSON.stringify({
               callParams: {
                   callUrlInfo: {
                       baseUrl,
                       callName: roomName
                   }
               },
               sipClientParams: {
                   displayName,
                   sipAddress: inviteItems.map(item => item.address)
               }
           }),
           method: 'POST',
           headers: {
               'Authorization': `Bearer ${jwt}`,
               'Content-Type': 'application/json'
           }
       }
    );
}
