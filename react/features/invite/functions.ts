import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { getRoomName } from '../base/conference/functions';
import { getInviteURL } from '../base/connection/functions';
import { isIosMobileBrowser } from '../base/environment/utils';
import i18next from '../base/i18n/i18next';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import { getLocalParticipant, isLocalParticipantModerator } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { doGetJSON } from '../base/util/httpUtils';
import { parseURLParams } from '../base/util/parseURLParams';
import {
    StatusCode,
    appendURLParam,
    parseURIString
} from '../base/util/uri';
import { isVpaasMeeting } from '../jaas/functions';
import { getActiveSession } from '../recording/functions';

import { getDialInConferenceID, getDialInNumbers } from './_utils';
import {
    DIAL_IN_INFO_PAGE_PATH_NAME,
    INVITE_TYPES,
    SIP_ADDRESS_REGEX,
    UPGRADE_OPTIONS_TEXT
} from './constants';
import logger from './logger';
import { IInvitee } from './types';


export const sharingFeatures = {
    email: 'email',
    url: 'url',
    dialIn: 'dial-in',
    embed: 'embed'
};

/**
 * Sends an ajax request to check if the phone number can be called.
 *
 * @param {string} dialNumber - The dial number to check for validity.
 * @param {string} dialOutAuthUrl - The endpoint to use for checking validity.
 * @param {string} region - The region we are connected to.
 * @returns {Promise} - The promise created by the request.
 */
export function checkDialNumber(
        dialNumber: string,
        dialOutAuthUrl: string,
        region: string
): Promise<{ allow?: boolean; country?: string; phone?: string; }> {
    const fullUrl = `${dialOutAuthUrl}?phone=${dialNumber}&region=${region}`;

    return new Promise((resolve, reject) =>
        fetch(fullUrl)
            .then(res => {
                if (res.ok) {
                    resolve(res.json());
                } else {
                    reject(new Error('Request not successful!'));
                }
            })
            .catch(reject));
}

/**
 * Sends an ajax request to check if the outbound call is permitted.
 *
 * @param {string} dialOutRegionUrl - The config endpoint.
 * @param {string} jwt - The jwt token.
 * @param {string} appId - The customer id.
 * @param {string} phoneNumber - The destination phone number.
 * @returns {Promise} - The promise created by the request.
 */
export function checkOutboundDestination(
        dialOutRegionUrl: string,
        jwt: string,
        appId: string,
        phoneNumber: string
): Promise<any> {
    return doGetJSON(dialOutRegionUrl, true, {
        body: JSON.stringify({
            appId,
            phoneNumber
        }),
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
        }
    });
}

/**
 * Removes all non-numeric characters from a string.
 *
 * @param {string} text - The string from which to remove all characters except
 * numbers.
 * @returns {string} A string with only numbers.
 */
export function getDigitsOnly(text = ''): string {
    return text.replace(/\D/g, '');
}

/**
 * Type of the options to use when sending a search query.
 */
export type GetInviteResultsOptions = {

    /**
     * Whether or not to search for people.
     */
    addPeopleEnabled: boolean;

    /**
     * The customer id.
     */
    appId: string;

    /**
     * The endpoint to use for checking phone number validity.
     */
    dialOutAuthUrl: string;

    /**
     * Whether or not to check phone numbers.
     */
    dialOutEnabled: boolean;

    /**
     * The endpoint to use for checking dial permission to an outbound destination.
     */
    dialOutRegionUrl: string;

    /**
     * The jwt token to pass to the search service.
     */
    jwt: string;

    /**
     * Array with the query types that will be executed -
     * "conferenceRooms" | "user" | "room".
     */
    peopleSearchQueryTypes: Array<string>;

    /**
     * The url to query for people.
     */
    peopleSearchUrl: string;

    /**
     * The region we are connected to.
     */
    region: string;

    /**
     * Whether or not to check sip invites.
     */
    sipInviteEnabled: boolean;
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
): Promise<any> {
    const text = query.trim();

    const {
        addPeopleEnabled,
        appId,
        dialOutAuthUrl,
        dialOutRegionUrl,
        dialOutEnabled,
        peopleSearchQueryTypes,
        peopleSearchUrl,
        region,
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

        phoneNumberPromise = checkDialNumber(numberToVerify, dialOutAuthUrl, region);
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
        phoneNumberPromise = Promise.resolve<{ allow?: boolean; country?: string; phone?: string; }>({});
    }

    return Promise.all([ peopleSearchPromise, phoneNumberPromise ])
        .then(async ([ peopleResults, phoneResults ]) => {
            const results: any[] = [
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
                = peopleResults.find(result => result.type === INVITE_TYPES.PHONE);

            if (!hasPhoneResult && typeof phoneResults.allow === 'boolean') {
                const result = {
                    allowed: phoneResults.allow,
                    country: phoneResults.country,
                    type: INVITE_TYPES.PHONE,
                    number: phoneResults.phone,
                    originalEntry: text,
                    showCountryCodeReminder: !hasCountryCode
                };

                if (!phoneResults.allow) {
                    try {
                        const response = await checkOutboundDestination(dialOutRegionUrl, jwt, appId, text);

                        result.allowed = response.allowed;
                    } catch (error) {
                        logger.error('Error checking permission to dial to outbound destination', error);
                    }
                }

                results.push(result);
            }

            if (sipInviteEnabled && isASipAddress(text)) {
                results.push({
                    type: INVITE_TYPES.SIP,
                    address: text
                });
            }

            return results;
        });
}

/**
 * Creates a custom no new lines message for iOS default mail describing how to dial in to the conference.
 *
 * @returns {string}
 */
export function getInviteTextiOS({
    state,
    phoneNumber,
    t
}: { phoneNumber?: string | null; state: IReduxState; t?: Function; }) {
    if (!isIosMobileBrowser()) {
        return '';
    }

    const dialIn = state['features/invite'];
    const inviteUrl = getInviteURL(state);
    const localParticipant = getLocalParticipant(state);
    const localParticipantName = localParticipant?.name;

    const inviteURL = _decodeRoomURI(inviteUrl);

    let invite = localParticipantName
        ? t?.('info.inviteTextiOSPersonal', { name: localParticipantName })
        : t?.('info.inviteURLFirstPartGeneral');

    invite += ' ';

    invite += t?.('info.inviteTextiOSInviteUrl', { inviteUrl });
    invite += ' ';

    if (shouldDisplayDialIn(dialIn) && isSharingEnabled(sharingFeatures.dialIn)) {
        invite += t?.('info.inviteTextiOSPhone', {
            number: phoneNumber,
            conferenceID: dialIn.conferenceID,
            didUrl: getDialInfoPageURL(state)
        });
    }
    invite += ' ';
    invite += t?.('info.inviteTextiOSJoinSilent', { silentUrl: `${inviteURL}#config.startSilent=true` });

    return invite;
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
}: { phoneNumber?: string | null; state: IReduxState; t?: Function; }) {
    const dialIn = state['features/invite'];
    const inviteUrl = getInviteURL(state);
    const currentLiveStreamingSession = getActiveSession(state, JitsiRecordingConstants.mode.STREAM);
    const liveStreamViewURL = currentLiveStreamingSession?.liveStreamViewURL;
    const localParticipant = getLocalParticipant(state);
    const localParticipantName = localParticipant?.name;

    const inviteURL = _decodeRoomURI(inviteUrl);
    let invite = localParticipantName
        ? t?.('info.inviteURLFirstPartPersonal', { name: localParticipantName })
        : t?.('info.inviteURLFirstPartGeneral');

    invite += t?.('info.inviteURLSecondPart', {
        url: inviteURL
    });

    if (liveStreamViewURL) {
        const liveStream = t?.('info.inviteLiveStream', {
            url: liveStreamViewURL
        });

        invite = `${invite}\n${liveStream}`;
    }

    if (shouldDisplayDialIn(dialIn) && isSharingEnabled(sharingFeatures.dialIn)) {
        const dial = t?.('info.invitePhone', {
            number: phoneNumber,
            conferenceID: dialIn.conferenceID
        });
        const moreNumbers = t?.('info.invitePhoneAlternatives', {
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
export function getInviteTypeCounts(inviteItems: IInvitee[] = []) {
    const inviteTypeCounts: any = {};

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
export function invitePeopleAndChatRooms(
        inviteServiceUrl: string,
        inviteUrl: string,
        jwt: string,
        inviteItems: Array<Object>
): Promise<any> {

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
 * @param {IReduxState} state - Current state.
 * @returns {boolean} Indication of whether adding people is currently enabled.
 */
export function isAddPeopleEnabled(state: IReduxState): boolean {
    const { peopleSearchUrl } = state['features/base/config'];

    return Boolean(state['features/base/jwt'].jwt && Boolean(peopleSearchUrl) && !isVpaasMeeting(state));
}

/**
 * Determines if dial out is currently enabled or not.
 *
 * @param {IReduxState} state - Current state.
 * @returns {boolean} Indication of whether dial out is currently enabled.
 */
export function isDialOutEnabled(state: IReduxState): boolean {
    const { conference } = state['features/base/conference'];

    return isLocalParticipantModerator(state)
        && conference && conference.isSIPCallingSupported();
}

/**
 * Determines if inviting sip endpoints is enabled or not.
 *
 * @param {IReduxState} state - Current state.
 * @returns {boolean} Indication of whether sip invite is currently enabled.
 */
export function isSipInviteEnabled(state: IReduxState): boolean {
    const { sipInviteUrl } = state['features/base/config'];

    return isLocalParticipantModerator(state)
        && isJwtFeatureEnabled(state, 'sip-outbound-call')
        && Boolean(sipInviteUrl);
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
): Promise<Array<{ type: string; }>> {

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
 * @param {IReduxState} state - The current state.
 * @param {string} inviteUrl - The conference/location URL.
 * @param {boolean} useHtml - Whether to return html text.
 * @returns {Promise<string>} A {@code Promise} resolving with a
 * descriptive text that can be used to invite participants to a meeting.
 */
export function getShareInfoText(state: IReduxState, inviteUrl: string, useHtml?: boolean): Promise<string> {
    let roomUrl = _decodeRoomURI(inviteUrl);
    const includeDialInfo = state['features/base/config'] !== undefined;

    if (useHtml) {
        roomUrl = `<a href="${roomUrl}">${roomUrl}</a>`;
    }

    let infoText = i18next.t('share.mainText', { roomUrl });

    if (includeDialInfo) {
        const { room } = parseURIString(inviteUrl);
        let numbersPromise;
        let hasPaymentError = false;

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
            const { locationURL = {} } = state['features/base/connection'];
            const mucURL = hosts?.muc;

            if (!dialInConfCodeUrl || !dialInNumbersUrl || !mucURL) {
                // URLs for fetching dial in numbers not defined
                return Promise.resolve(infoText);
            }

            numbersPromise = Promise.all([
                getDialInNumbers(dialInNumbersUrl, room, mucURL), // @ts-ignore
                getDialInConferenceID(dialInConfCodeUrl, room, mucURL, locationURL)
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
            .catch(error => {
                logger.error('Error fetching numbers or conferenceID', error);
                hasPaymentError = error?.status === StatusCode.PaymentRequired;
            })
            .then(defaultDialInNumber => {
                if (hasPaymentError) {
                    infoText += `${
                        i18next.t('info.dialInNumber')} ${i18next.t('info.reachedLimit')} ${
                        i18next.t('info.upgradeOptions')} ${UPGRADE_OPTIONS_TEXT}`;

                    return infoText;
                }

                let dialInfoPageUrl = getDialInfoPageURL(state, room);

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
 * @param {IReduxState} state - The state from the Redux store.
 * @param {string?} roomName - The conference name. Optional name, if missing will be extracted from state.
 * @returns {string}
 */
export function getDialInfoPageURL(state: IReduxState, roomName?: string) {
    const { didPageUrl } = state['features/dynamic-branding'];
    const conferenceName = roomName ?? getRoomName(state);
    const { locationURL } = state['features/base/connection'];
    const { href = '' } = locationURL ?? {};
    const room = _decodeRoomURI(conferenceName ?? '');

    const url = didPageUrl || `${href.substring(0, href.lastIndexOf('/'))}/${DIAL_IN_INFO_PAGE_PATH_NAME}`;

    return appendURLParam(url, 'room', room);
}

/**
 * Generates the URL for the static dial in info page.
 *
 * @param {string} uri - The conference URI string.
 * @returns {string}
 */
export function getDialInfoPageURLForURIString(
        uri?: string) {
    if (!uri) {
        return undefined;
    }
    const { protocol, host, contextRoot, room } = parseURIString(uri);
    let url = `${protocol}//${host}${contextRoot}${DIAL_IN_INFO_PAGE_PATH_NAME}`;

    url = appendURLParam(url, 'room', room);

    const { release } = parseURLParams(uri, true, 'search');

    release && (url = appendURLParam(url, 'release', release));

    return url;
}

/**
 * Returns whether or not dial-in related UI should be displayed.
 *
 * @param {Object} dialIn - Dial in information.
 * @returns {boolean}
 */
export function shouldDisplayDialIn(dialIn: any) {
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
export function hasMultipleNumbers(dialInNumbers?: { numbers: Object; } | string[]) {
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
        dialInNumbers?: { numbers: any; } | Array<{ default: string; formattedNumber: string; }>): string | null {

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
 * @param {IStateful} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {string}
 */
export function getConferenceId(stateful: IStateful) {
    return toState(stateful)['features/invite'].conferenceID;
}

/**
 * Returns the default dial in number from the store.
 *
 * @param {IStateful} stateful - The Object or Function that can be
 * resolved to a Redux state object with the toState function.
 * @returns {string | null}
 */
export function getDefaultDialInNumber(stateful: IStateful) {
    // @ts-ignore
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
 * @param {string} roomPassword - The password of the conference.
 * @param {string} displayName - The user display name.
 * @returns {Promise} - The promise created by the request.
 */
export function inviteSipEndpoints( // eslint-disable-line max-params
        inviteItems: Array<{ address: string; }>,
        locationURL: URL,
        sipInviteUrl: string,
        jwt: string,
        roomName: string,
        roomPassword: String,
        displayName: string
): Promise<any> {
    if (inviteItems.length === 0) {
        return Promise.resolve();
    }

    const regex = new RegExp(`/${roomName}`, 'i');
    const baseUrl = Object.assign(new URL(locationURL.toString()), {
        pathname: locationURL.pathname.replace(regex, ''),
        hash: '',
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
                    },
                    passcode: roomPassword
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
