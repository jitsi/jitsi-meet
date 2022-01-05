// @flow

import { Client } from '@microsoft/microsoft-graph-client';
import base64js from 'base64-js';
import type { Dispatch } from 'redux';
import { findWindows } from 'windows-iana';

import { createDeferred } from '../../../../modules/util/helpers';
import { parseStandardURIString, parseURLParams } from '../../base/util';
import { getShareInfoText } from '../../invite';
import { setCalendarAPIAuthState } from '../actions';


/**
 * Constants used for interacting with the Microsoft API.
 *
 * @private
 * @type {object}
 */
const MS_API_CONFIGURATION = {
    /**
     * The URL to use when authenticating using Microsoft API.
     *
     * @type {string}
     */
    AUTH_ENDPOINT:
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?',

    CALENDAR_ENDPOINT: '/me/calendars',

    /**
     * The Microsoft API scopes to request access for calendar.
     *
     * @type {string}
     */
    MS_API_SCOPES: 'openid profile Calendars.ReadWrite',

    /**
     * See https://docs.microsoft.com/en-us/azure/active-directory/develop/
     * v2-oauth2-implicit-grant-flow#send-the-sign-in-request. This value is
     * needed for passing in the proper domain_hint value when trying to refresh
     * a token silently.
     *
     * @type {string}
     */
    MS_CONSUMER_TENANT: '9188040d-6c67-4c5b-b112-36a304b66dad',

    /**
     * The redirect URL to be used by the Microsoft API on successful
     * authentication.
     *
     * @type {string}
     */
    REDIRECT_URI: `${window.location.origin}/static/msredirect.html`
};

/**
 * Store the window from an auth request. That way it can be reused if a new
 * request comes in and it can be used to indicate a request is in progress.
 *
 * @private
 * @type {Object|null}
 */
let popupAuthWindow = null;

/**
 * A stateless collection of action creators that implements the expected
 * interface for interacting with the Microsoft API in order to get calendar
 * data.
 *
 * @type {Object}
 */
export const microsoftCalendarApi = {
    /**
     * Retrieves the current calendar events.
     *
     * @param {number} fetchStartDays - The number of days to go back
     * when fetching.
     * @param {number} fetchEndDays - The number of days to fetch.
     * @returns {function(Dispatch<any>, Function): Promise<CalendarEntries>}
     */
    getCalendarEntries(fetchStartDays: ?number, fetchEndDays: ?number) {
        return (dispatch: Dispatch<any>, getState: Function): Promise<*> => {
            const state = getState()['features/calendar-sync'] || {};
            const token = state.msAuthState && state.msAuthState.accessToken;

            if (!token) {
                return Promise.reject('Not authorized, please sign in!');
            }

            const client = Client.init({
                authProvider: done => done(null, token)
            });

            return client
                .api(MS_API_CONFIGURATION.CALENDAR_ENDPOINT)
                .get()
                .then(response => {
                    const calendarIds = response.value.map(en => en.id);
                    const getEventsPromises = calendarIds.map(id =>
                        requestCalendarEvents(
                            client, id, fetchStartDays, fetchEndDays));

                    return Promise.all(getEventsPromises);
                })

                // get .value of every element from the array of results,
                // which is an array of events and flatten it to one array
                // of events
                .then(result => [].concat(...result))
                .then(entries => entries.map(e => formatCalendarEntry(e)));
        };
    },

    /**
     * Returns the email address for the currently logged in user.
     *
     * @returns {function(Dispatch<*, Function>): Promise<string>}
     */
    getCurrentEmail(): Function {
        return (dispatch: Dispatch<any>, getState: Function) => {
            const { msAuthState = {} }
                = getState()['features/calendar-sync'] || {};
            const email = msAuthState.userSigninName || '';

            return Promise.resolve(email);
        };
    },

    /**
     * Sets the application ID to use for interacting with the Microsoft API.
     *
     * @returns {function(): Promise<void>}
     */
    load(): Function {
        return () => Promise.resolve();
    },

    /**
     * Prompts the participant to sign in to the Microsoft API Client Library.
     *
     * @returns {function(Dispatch<any>, Function): Promise<void>}
     */
    signIn(): Function {
        return (dispatch: Dispatch<any>, getState: Function) => {
            // Ensure only one popup window at a time.
            if (popupAuthWindow) {
                popupAuthWindow.focus();

                return Promise.reject('Sign in already in progress.');
            }

            const signInDeferred = createDeferred();

            const guids = {
                authState: generateGuid(),
                authNonce: generateGuid()
            };

            dispatch(setCalendarAPIAuthState(guids));

            const { microsoftApiApplicationClientID }
                = getState()['features/base/config'];
            const authUrl = getAuthUrl(
                microsoftApiApplicationClientID,
                guids.authState,
                guids.authNonce);
            const h = 600;
            const w = 480;

            popupAuthWindow = window.open(
                authUrl,
                'Auth M$',
                `width=${w}, height=${h}, top=${
                    (screen.height / 2) - (h / 2)}, left=${
                    (screen.width / 2) - (w / 2)}`);

            const windowCloseCheck = setInterval(() => {
                if (popupAuthWindow && popupAuthWindow.closed) {
                    signInDeferred.reject(
                        'Popup closed before completing auth.');
                    popupAuthWindow = null;
                    window.removeEventListener('message', handleAuth);
                    clearInterval(windowCloseCheck);
                } else if (!popupAuthWindow) {
                    // This case probably happened because the user completed
                    // auth.
                    clearInterval(windowCloseCheck);
                }
            }, 500);

            /**
             * Callback with scope access to other variables that are part of
             * the sign in request.
             *
             * @param {Object} event - The event from the post message.
             * @private
             * @returns {void}
             */
            function handleAuth({ data }) {
                if (!data || data.type !== 'ms-login') {
                    return;
                }

                window.removeEventListener('message', handleAuth);

                popupAuthWindow && popupAuthWindow.close();
                popupAuthWindow = null;

                const params = getParamsFromHash(data.url);
                const tokenParts = getValidatedTokenParts(
                    params, guids, microsoftApiApplicationClientID);

                if (!tokenParts) {
                    signInDeferred.reject('Invalid token received');

                    return;
                }

                dispatch(setCalendarAPIAuthState({
                    authState: undefined,
                    accessToken: tokenParts.accessToken,
                    idToken: tokenParts.idToken,
                    tokenExpires: params.tokenExpires,
                    userDomainType: tokenParts.userDomainType,
                    userSigninName: tokenParts.userSigninName
                }));

                signInDeferred.resolve();
            }

            window.addEventListener('message', handleAuth);

            return signInDeferred.promise;
        };
    },

    /**
     * Returns whether or not the user is currently signed in.
     *
     * @returns {function(Dispatch<any>, Function): Promise<boolean>}
     */
    _isSignedIn(): Function {
        return (dispatch: Dispatch<any>, getState: Function) => {
            const now = new Date().getTime();
            const state
                = getState()['features/calendar-sync'].msAuthState || {};
            const tokenExpires = parseInt(state.tokenExpires, 10);
            const isExpired = now > tokenExpires && !isNaN(tokenExpires);

            if (state.accessToken && isExpired) {
                // token expired, let's refresh it
                return dispatch(refreshAuthToken())
                    .then(() => true)
                    .catch(() => false);
            }

            return Promise.resolve(state.accessToken && !isExpired);
        };
    },

    /**
     * Updates calendar event by generating new invite URL and editing the event
     * adding some descriptive text and location.
     *
     * @param {string} id - The event id.
     * @param {string} calendarId - The id of the calendar to use.
     * @param {string} location - The location to save to the event.
     * @returns {function(Dispatch<any>): Promise<string|never>}
     */
    updateCalendarEvent(id: string, calendarId: string, location: string) {
        return (dispatch: Dispatch<any>, getState: Function): Promise<*> => {
            const state = getState()['features/calendar-sync'] || {};
            const token = state.msAuthState && state.msAuthState.accessToken;

            if (!token) {
                return Promise.reject('Not authorized, please sign in!');
            }

            return getShareInfoText(getState(), location, true/* use html */)
                .then(text => {
                    const client = Client.init({
                        authProvider: done => done(null, token)
                    });

                    return client
                        .api(`/me/events/${id}`)
                        .get()
                        .then(description => {
                            const body = description.body;

                            if (description.bodyPreview) {
                                body.content
                                    = `${description.bodyPreview}<br><br>`;
                            }

                            // replace all new lines from the text with html
                            // <br> to make it pretty
                            body.content += text.split('\n').join('<br>');

                            return client
                                .api(`/me/calendar/events/${id}`)
                                .patch({
                                    body,
                                    location: {
                                        'displayName': location
                                    }
                                });
                        });
                });
        };
    }
};

/**
 * Parses the Microsoft calendar entries to a known format.
 *
 * @param {Object} entry - The Microsoft calendar entry.
 * @private
 * @returns {{
 *     calendarId: string,
 *     description: string,
 *     endDate: string,
 *     id: string,
 *     location: string,
 *     startDate: string,
 *     title: string
 * }}
 */
function formatCalendarEntry(entry) {
    return {
        calendarId: entry.calendarId,
        description: entry.body.content,
        endDate: entry.end.dateTime,
        id: entry.id,
        location: entry.location.displayName,
        startDate: entry.start.dateTime,
        title: entry.subject
    };
}

/**
 * Generate a guid to be used for verifying token validity.
 *
 * @private
 * @returns {string} The generated string.
 */
function generateGuid() {
    const buf = new Uint16Array(8);

    window.crypto.getRandomValues(buf);

    return `${s4(buf[0])}${s4(buf[1])}-${s4(buf[2])}-${s4(buf[3])}-${
        s4(buf[4])}-${s4(buf[5])}${s4(buf[6])}${s4(buf[7])}`;
}

/**
 * Constructs and returns the URL to use for renewing an auth token.
 *
 * @param {string} appId - The Microsoft application id to log into.
 * @param {string} userDomainType - The domain type of the application as
 * provided by Microsoft.
 * @param {string} userSigninName - The email of the user signed into the
 * integration with Microsoft.
 * @private
 * @returns {string} - The auth URL.
 */
function getAuthRefreshUrl(appId, userDomainType, userSigninName) {
    return [
        getAuthUrl(appId, 'undefined', 'undefined'),
        'prompt=none',
        `domain_hint=${userDomainType}`,
        `login_hint=${userSigninName}`
    ].join('&');
}

/**
 * Constructs and returns the auth URL to use for login.
 *
 * @param {string} appId - The Microsoft application id to log into.
 * @param {string} authState - The authState guid to use.
 * @param {string} authNonce - The authNonce guid to use.
 * @private
 * @returns {string} - The auth URL.
 */
function getAuthUrl(appId, authState, authNonce) {
    const authParams = [
        'response_type=id_token+token',
        `client_id=${appId}`,
        `redirect_uri=${MS_API_CONFIGURATION.REDIRECT_URI}`,
        `scope=${MS_API_CONFIGURATION.MS_API_SCOPES}`,
        `state=${authState}`,
        `nonce=${authNonce}`,
        'response_mode=fragment'
    ].join('&');

    return `${MS_API_CONFIGURATION.AUTH_ENDPOINT}${authParams}`;
}

/**
 * Converts a url from an auth redirect into an object of parameters passed
 * into the url.
 *
 * @param {string} url - The string to parse.
 * @private
 * @returns {Object}
 */
function getParamsFromHash(url) {
    const params = parseURLParams(parseStandardURIString(url), true, 'hash');

    // Get the number of seconds the token is valid for, subtract 5 minutes
    // to account for differences in clock settings and convert to ms.
    const expiresIn = (parseInt(params.expires_in, 10) - 300) * 1000;
    const now = new Date();
    const expireDate = new Date(now.getTime() + expiresIn);

    params.tokenExpires = expireDate.getTime().toString();

    return params;
}

/**
 * Converts the parameters from a Microsoft auth redirect into an object of
 * token parts. The value "null" will be returned if the params do not produce
 * a valid token.
 *
 * @param {Object} tokenInfo - The token object.
 * @param {Object} guids - The guids for authState and authNonce that should
 * match in the token.
 * @param {Object} appId - The Microsoft application this token is for.
 * @private
 * @returns {Object|null}
 */
function getValidatedTokenParts(tokenInfo, guids, appId) {
    // Make sure the token matches the request source by matching the GUID.
    if (tokenInfo.state !== guids.authState) {
        return null;
    }

    const idToken = tokenInfo.id_token;

    // A token must exist to be valid.
    if (!idToken) {
        return null;
    }

    const tokenParts = idToken.split('.');

    if (tokenParts.length !== 3) {
        return null;
    }

    let payload;

    try {
        payload = JSON.parse(b64utoutf8(tokenParts[1]));
    } catch (e) {
        return null;
    }

    if (payload.nonce !== guids.authNonce
        || payload.aud !== appId
        || payload.iss
            !== `https://login.microsoftonline.com/${payload.tid}/v2.0`) {
        return null;
    }

    const now = new Date();

    // Adjust by 5 minutes to allow for inconsistencies in system clocks.
    const notBefore = new Date((payload.nbf - 300) * 1000);
    const expires = new Date((payload.exp + 300) * 1000);

    if (now < notBefore || now > expires) {
        return null;
    }

    return {
        accessToken: tokenInfo.access_token,
        idToken,
        userDisplayName: payload.name,
        userDomainType:
            payload.tid === MS_API_CONFIGURATION.MS_CONSUMER_TENANT
                ? 'consumers' : 'organizations',
        userSigninName: payload.preferred_username
    };
}

/**
 * Renews an existing auth token so it can continue to be used.
 *
 * @private
 * @returns {function(Dispatch<any>, Function): Promise<void>}
 */
function refreshAuthToken(): Function {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { microsoftApiApplicationClientID }
            = getState()['features/base/config'];
        const { msAuthState = {} }
            = getState()['features/calendar-sync'] || {};

        const refreshAuthUrl = getAuthRefreshUrl(
            microsoftApiApplicationClientID,
            msAuthState.userDomainType,
            msAuthState.userSigninName);

        const iframe = document.createElement('iframe');

        iframe.setAttribute('id', 'auth-iframe');
        iframe.setAttribute('name', 'auth-iframe');
        iframe.setAttribute('style', 'display: none');
        iframe.setAttribute('src', refreshAuthUrl);

        const signInPromise = new Promise(resolve => {
            iframe.onload = () => {
                resolve(iframe.contentWindow.location.hash);
            };
        });

        // The check for body existence is done for flow, which also runs
        // against native where document.body may not be defined.
        if (!document.body) {
            return Promise.reject(
                'Cannot refresh auth token in this environment');
        }

        document.body.appendChild(iframe);

        return signInPromise.then(hash => {
            const params = getParamsFromHash(hash);

            dispatch(setCalendarAPIAuthState({
                accessToken: params.access_token,
                idToken: params.id_token,
                tokenExpires: params.tokenExpires
            }));
        });
    };
}

/**
 * Retrieves calendar entries from a specific calendar.
 *
 * @param {Object} client - The Microsoft-graph-client initialized.
 * @param {string} calendarId - The calendar ID to use.
 * @param {number} fetchStartDays - The number of days to go back
 * when fetching.
 * @param {number} fetchEndDays - The number of days to fetch.
 * @returns {Promise<any> | Promise}
 * @private
 */
function requestCalendarEvents( // eslint-disable-line max-params
        client,
        calendarId,
        fetchStartDays,
        fetchEndDays): Promise<*> {
    const startDate = new Date();
    const endDate = new Date();

    startDate.setDate(startDate.getDate() + fetchStartDays);
    endDate.setDate(endDate.getDate() + fetchEndDays);

    const filter = `Start/DateTime ge '${
        startDate.toISOString()}' and End/DateTime lt '${
        endDate.toISOString()}'`;

    const ianaTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const windowsTimeZone = findWindows(ianaTimeZone);

    return client
        .api(`/me/calendars/${calendarId}/events`)
        .filter(filter)
        .header('Prefer', `outlook.timezone="${windowsTimeZone}"`)
        .select('id,subject,start,end,location,body')
        .orderby('createdDateTime DESC')
        .get()
        .then(result => result.value.map(item => {
            return {
                ...item,
                calendarId
            };
        }));
}

/**
 * Converts the passed in number to a string and ensure it is at least 4
 * characters in length, prepending 0's as needed.
 *
 * @param {number} num - The number to pad and convert to a string.
 * @private
 * @returns {string} - The number converted to a string.
 */
function s4(num) {
    let ret = num.toString(16);

    while (ret.length < 4) {
        ret = `0${ret}`;
    }

    return ret;
}

/**
 * Convert a Base64URL encoded string to a UTF-8 encoded string including CJK or Latin.
 *
 * @param {string} str - The string that needs conversion.
 * @private
 * @returns {string} - The converted string.
 */
function b64utoutf8(str) {
    let s = str;

    // Convert from Base64URL to Base64.

    if (s.length % 4 === 2) {
        s += '==';
    } else if (s.length % 4 === 3) {
        s += '=';
    }

    s = s.replace(/-/g, '+').replace(/_/g, '/');

    // Convert Base64 to a byte array.

    const bytes = base64js.toByteArray(s);

    // Convert bytes to hex.

    s = bytes.reduce((str_, byte) => str_ + byte.toString(16).padStart(2, '0'), '');

    // Convert a hexadecimal string to a URLComponent string

    s = s.replace(/(..)/g, '%$1');

    // Decodee the URI component

    return decodeURIComponent(s);
}
