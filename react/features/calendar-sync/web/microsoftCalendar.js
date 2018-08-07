/* @flow */

import { Client } from '@microsoft/microsoft-graph-client';
import rs from 'jsrsasign';

import { createDeferred } from '../../../../modules/util/helpers';

import { CALENDAR_TYPE } from '../constants';
import {
    setCalendarAPIAuthState,
    setCalendarProfileEmail
} from '../actions';

/**
 * Constants used for interacting with the Microsoft API.
 *
 * @private
 * @type {object}
 */
const MS_API_CONFIGURATION = {
    /**
     * The URL to use when authenticating using Microsoft API.
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
    MS_API_SCOPES: 'openid profile Calendars.Read',

    /**
     * See https://docs.microsoft.com/en-us/azure/active-directory/develop/
     * v2-oauth2-implicit-grant-flow#send-the-sign-in-request.
     *
     * FIXME BEFORE MERGE: Why is this needed?
     *
     * @type {string}
     */
    MS_CONSUMER_TENANT: '9188040d-6c67-4c5b-b112-36a304b66da',

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

export const microsoftCalendarApi = {
    /**
     * Retrieves the current calendar events.
     *
     * @param {number} fetchStartDays - The number of days to go back
     * when fetching.
     * @param {number} fetchEndDays - The number of days to fetch.
     * @returns {function(Dispatch<*>): Promise<CalendarEntries>}
     */
    getCalendarEntries(fetchStartDays: ?number, fetchEndDays: ?number) {
        return (dispatch: Dispatch<*>, getState: Function): Promise<*> => {
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
                .then(result => [].concat(...result.map(en => en.value)))
                .then(entries => entries.map(e => formatCalendarEntry(e)));
        };
    },

    /**
     * Returns the type of calendar integration this object implements.
     *
     * @returns {string}
     */
    getType(): string {
        return CALENDAR_TYPE.MICROSOFT;
    },

    /**
     * Sets the application ID to use for interacting with the Microsoft API.
     *
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    load(): Function {
        return () => Promise.resolve();
    },

    /**
     * Prompts the participant to sign in to the Microsoft API Client Library.
     *
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    signIn(): Function {
        return (dispatch: Dispatch<*>, getState: Function) => {
            // Ensure only one popup window at a time.
            if (popupAuthWindow) {
                popupAuthWindow.focus();

                return Promise.reject('Sign in already in progress.');
            }

            // FIXME BEFORE MERGE: handle case of user closing the modal.
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

                const params = getParamsFromHash(data.hash);
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
                    tokenExpires: tokenParts.tokenExpires,
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
     * Sign out from the Microsoft API Client Library.
     *
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    signOut(): Function {
        // Using the Outlook API Get Started guide, there is no revoking to be
        // done with the Microsoft API. Instead any stored state on the app-side
        // should be cleared and the token should be allowed to expire.
        return () => Promise.resolve();
    },

    /**
     * Updates the profile data using calendar-sync feature.
     *
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    updateProfile(): Function {
        return (dispatch: Dispatch<*>, getState: Function) => {
            const { msAuthState = {} }
                = getState()['features/calendar-sync'] || {};
            const email = msAuthState.userSigninName || '';

            dispatch(setCalendarProfileEmail(email));

            return Promise.resolve(email);
        };
    },

    /**
     * Renews an existing auth token so it can continue to be used.
     *
     * @private
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    _refreshAuthToken(): Function {
        return (dispatch: Dispatch<*>, getState: Function) => {
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
                    tokenExpires: parseInt(params.tokenExpires, 10)
                }));
            });
        };
    },

    /**
     * Returns whether or not the user is currently signed in.
     *
     * @returns {function(Dispatch<*>): Promise<boolean>}
     */
    _isSignedIn(): Function {
        return (dispatch, getState) => {
            const now = new Date().getTime();
            const state
                = getState()['features/calendar-sync'].msAuthState || {};
            const tokenExpires = parseInt(state.tokenExpires, 10);
            const isExpired = now > tokenExpires && !isNaN(tokenExpires);
            const validToken = state.accessToken && !isExpired;

            if (!validToken) {
                return Promise.resolve(false);
            }

            const client = Client.init({
                authProvider: done => done(null, state.accessToken)
            });

            return client
                .api('/me')
                .get()
                .then(() => true)
                .catch(() => false);
        };
    }
};

/**
 * Parses the Microsoft calendar entries to a known format.
 *
 * @param {Object} entry - The Microsoft calendar entry.
 * @returns {{
 *     id: string,
 *     startDate: string,
 *     endDate: string,
 *     title: string,
 *     location: string,
 *     description: string
 * }}
 * @private
 */
function formatCalendarEntry(entry) {
    return {
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
 * @returns {string} The generated string.
 * @private
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
 * @returns {string} - The auth URL.
 * @private
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
 * @returns {string} - The auth URL.
 * @private
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
 * Converts a hash parameter string into an object.
 *
 * @param {string} hash - The string to parse.
 * @private
 * @returns {Object}
 */
function getParamsFromHash(hash) {
    const params = new URLSearchParams(hash.slice(1, hash.length));

    // Get the number of seconds the token is valid for, subtract 5 minutes
    // to account for differences in clock settings and convert to ms.
    const expiresIn = (parseInt(params.get('expires_in'), 10) - 300) * 1000;
    const now = new Date();
    const expireDate = new Date(now.getTime() + expiresIn);

    params.set('tokenExpires', expireDate.getTime().toString());

    // FIXME: what does this do?
    return Array.from(params.entries())
        .reduce((main, [ key, value ]) => {
            return {
                ...main,
                [key]: value
            };
        }, {});
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

    const payload
         = rs.KJUR.jws.JWS.readSafeJSONString(rs.b64utoutf8(tokenParts[1]));

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
        tokenExpires: expires.getTime(),
        userDisplayName: payload.name,
        userSigninName: payload.preferred_username,
        userDomainType:
            payload.tid === MS_API_CONFIGURATION.MS_CONSUMER_TENANT
                ? 'consumers' : 'organizations'
    };
}

/* eslint-disable max-params */
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
function requestCalendarEvents(
        client,
        calendarId,
        fetchStartDays,
        fetchEndDays): Promise<*> {
    /* eslint-enable max-params */

    const startDate = new Date();
    const endDate = new Date();

    startDate.setDate(startDate.getDate() + fetchStartDays);
    endDate.setDate(endDate.getDate() + fetchEndDays);

    const filter = `Start/DateTime ge '${
        startDate.toISOString()}' and End/DateTime lt '${
        endDate.toISOString()}'`;

    return client
        .api(`/me/calendars/${calendarId}/events`)
        .filter(filter)
        .select('id,subject,start,end,location,body')
        .orderby('createdDateTime DESC')
        .get();
}

/**
 * Something.
 *
 * FIXME BEFORE MERGE: Understand what exactly these Microsoft-provided
 * functions do.
 *
 * @param {number} num - The number.
 * @private
 * @returns {string} - The string.
 */
function s4(num) {
    let ret = num.toString(16);

    while (ret.length < 4) {
        ret = `0${ret}`;
    }

    return ret;
}
