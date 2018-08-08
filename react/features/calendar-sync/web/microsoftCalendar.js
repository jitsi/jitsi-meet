/* @flow */

import rs from 'jsrsasign';
import { Client } from '@microsoft/microsoft-graph-client';

import { CALENDAR_API_STATES } from '../constants';
import {
    setCalendarAPIAuthState,
    setCalendarAPIState,
    setCalendarProfileEmail
} from '../actions';

/**
 * The Microsoft API scopes to request access for calendar.
 *
 * @type {Array<string>}
 */
const MS_API_SCOPES = 'openid profile Calendars.Read';

/**
 * The redirect URL to be used by the Microsoft API.
 * @type {string}
 */
const REDIRECT_URI = `${window.location.origin}/static/msredirect.html`;

/**
 * The URL to use when authenticating using Microsoft API.
 * @type {string}
 */
const AUTH_ENDPOINT
    = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Loads and interacts with the Microsoft Calendar API.
 */
export class MicrosoftCalendarApi {
    /**
     * The ID for the Microsoft client application used to init the API.
     */
    _appClientID: string;

    /**
     * The current request data.
     */
    _currentRequest: ?Object;

    /**
     * The last valid response data.
     */
    _lastValidResponse: ?Object;

    /**
     * The popup window used for authentication, using the instance to close
     * the popup once we have all the info we need.
     */
    _popupAuthWindow: ?Object;

    /**
     * The redux {@code dispatch} function.
     */
    _dispatch: Dispatch<*>;

    /**
     * The redux function that gets/retrieves the redux state.
     */
    _getState: Function;

    /**
     * Initializes a new Microsoft Calendar API instance.
     *
     * @param {string} appClientID - The ID for the Microsoft client application
     * used to init the API.
     * @param {Object} store - The redux store.
     */
    constructor(appClientID: string, store: Object) {
        this._appClientID = appClientID;
        this._dispatch = store.dispatch;
        this._getState = store.getState;
        this._currentRequest = {};

        // checks post messages for events from the popup
        window.addEventListener('message', this._onPostMessage.bind(this));
    }

    /**
     * Initializes the api.
     *
     * @returns {function(Dispatch<*>): Promise<void>}
     */
    init(): Promise<void> {
        this._dispatch(setCalendarAPIState(CALENDAR_API_STATES.LOADED));

        if (this._isSignedIn()) {
            this._updateAPIToSignedIn();
        }

        return Promise.resolve();
    }

    /**
     * Retrieves the current calendar events.
     *
     * @param {number} fetchStartDays - The number of days to go back
     * when fetching.
     * @param {number} fetchEndDays - The number of days to fetch.
     * @returns {function(Dispatch<*>): Promise<CalendarEntries>}
     */
    getCalendarEntries(
            fetchStartDays: ?number, fetchEndDays: ?number) {
        return (dispatch: Dispatch<*>, getState: Function): Promise<*> => {

            // not authorized, skip
            if (!getState()['features/calendar-sync'].msAuthState
                || !this._isSignedIn()) {
                return Promise.reject('Not authorized, please sign in!');
            }

            const client = Client.init({
                authProvider: done => done(
                    null,
                    getState()['features/calendar-sync']
                        .msAuthState.accessToken)
            });

            return client
                .api('/me/calendars')
                .get()
                .then(response => {
                    const calendarIds
                        = response.value.map(en => en.id);
                    const promises
                        = calendarIds.map(id =>
                            this._getCalendarEntries(
                                client, id, fetchStartDays, fetchEndDays));

                    return Promise.all(promises);
                })

                // get .value of every element from the array of results,
                // which is an array of events and flatten it to one array
                // of events
                .then(result =>
                    [].concat(...result.map(en => en.value)))
                .then(entries => entries.map(
                    e => this._convertCalendarEntry(e)));
        };
    }

    /**
     * Parses the microsoft calendar entries to a known format.
     *
     * @param {Object} entry - The microsoft calendar entry.
     * @returns {{
     *  id: string,
     *  startDate: string,
     *  endDate: string,
     *  title: string,
     *  location: string,
     *  description: string}}
     * @private
     */
    _convertCalendarEntry(entry) {
        return {
            id: entry.id,
            startDate: entry.start.dateTime,
            endDate: entry.end.dateTime,
            title: entry.subject,
            location: entry.location.displayName,
            description: entry.body.content
        };
    }

    /* eslint-disable max-params */
    /**
     * Retrieves calendar entries from a specific calendar.
     *
     * @param {Object} client - The microsoft-graph-client initialized.
     * @param {string} calendarId - The calendar ID to use.
     * @param {number} fetchStartDays - The number of days to go back
     * when fetching.
     * @param {number} fetchEndDays - The number of days to fetch.
     * @returns {Promise<any> | Promise}
     * @private
     */
    _getCalendarEntries(
            client,
            calendarId,
            fetchStartDays: ?number,
            fetchEndDays: ?number): Promise<*> {
        /* eslint-enable max-params */

        if (this._isSignedIn()) {
            this._updateAPIToSignedIn();
        } else {
            return Promise.reject('not signed in');
        }

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
     * Process received params/messages from popup window.
     *
     * @param {Object} params - The params received from the popup window.
     * @returns {void}
     * @private
     */
    _onAuth(params) {
        const objectParams = Array.from(params.entries())
            .reduce((main, [ key, value ]) => {
                return {
                    ...main,
                    [key]: value
                };
            }, {});

        const validatedPayload = this._getValidTokenParts({
            ...objectParams,
            ...this._currentRequest
        });

        if (validatedPayload) {
            // token is valid

            this._lastValidResponse = {
                ...validatedPayload,
                ...objectParams,
                ...this._currentRequest
            };
            this._currentRequest = {};

            this._dispatch(
                setCalendarAPIAuthState({
                    authState: undefined,
                    accessToken: validatedPayload.accessToken,
                    idToken: validatedPayload.idToken,
                    tokenExpires: validatedPayload.tokenExpires,
                    userSigninName: validatedPayload.userSigninName
                }));
            this._dispatch(
                setCalendarProfileEmail(validatedPayload.userSigninName));
            this._updateAPIToSignedIn();
        } else {
            logger.warn('token is not valid');

            this._dispatch(setCalendarAPIAuthState(undefined));
        }
    }

    /**
     * Extracts the valid token parts, if token is invalid returns null.
     *
     * @param {Object} tokenInfo - The token object.
     * @returns {*}
     * @private
     */
    _getValidTokenParts(tokenInfo) {
        const {
            authNonce = 'undefined',
            state
        } = tokenInfo;
        const storedState
            = this._getState()['features/calendar-sync'].msAuthState || {};

        if (state !== storedState.authState) {
            // error
            return null;
        }

        const idToken = tokenInfo.id_token;

        if (!idToken) {
            return null;
        }

        const tokenParts = idToken.split('.');

        if (tokenParts.length !== 3) {
            return null;
        }

        const payload
            = rs.KJUR.jws.JWS.readSafeJSONString(rs.b64utoutf8(tokenParts[1]));

        if (payload.nonce !== authNonce
            || payload.aud !== this._appClientID
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
                payload.tid === '9188040d-6c67-4c5b-b112-36a304b66dad'
                    ? 'consumers' : 'organizations'
        };
    }

    /**
     * Prompts the participant to sign in to the Microsoft API Client Library.
     *
     * @returns {Function}
     */
    signIn() {
        return () => {

            if (this._isSignedIn()) {
                this._dispatch(
                    setCalendarAPIState(CALENDAR_API_STATES.SIGNED_IN));

                return;
            }

            const guids = {
                authState: this._generateGuid(),
                authNonce: this._generateGuid()
            };

            // store state and nonce
            this._dispatch(setCalendarAPIAuthState(guids));
            this._currentRequest = guids;
            this._requestToken(guids.authState, guids.authNonce);
        };
    }

    /**
     * Sign out from the Microsoft API Client Library.
     *
     * @returns {function(Dispatch<*>): Promise<string|never>}
     */
    signOut() {
        return () => {
            this._dispatch(setCalendarAPIAuthState(undefined));
            this._dispatch(
                setCalendarAPIState(CALENDAR_API_STATES.LOADED));
        };
    }

    /**
     * Checks whether we have a saved token which had not expired.
     *
     * @returns {*|boolean} - Returns true if we have a token we can use.
     * @private
     */
    _isSignedIn() {
        const now = new Date().getTime();
        const state
            = this._getState()['features/calendar-sync'].msAuthState || {};
        const tokenExpires = parseInt(state.tokenExpires, 10);
        const isExpired = now > tokenExpires && !isNaN(tokenExpires);

        return state.accessToken && !isExpired;
    }

    /**
     * Generate guid.
     *
     * @returns {string} The generated string.
     * @private
     */
    _generateGuid() {
        const buf = new Uint16Array(8);

        window.crypto.getRandomValues(buf);

        /**
         * Something.
         *
         * @param {number} num - The number.
         * @returns {string} - The string.
         */
        function s4(num) {
            let ret = num.toString(16);

            while (ret.length < 4) {
                ret = `0${ret}`;
            }

            return ret;
        }

        return `${s4(buf[0])}${s4(buf[1])}-${s4(buf[2])}-${s4(buf[3])}-${
            s4(buf[4])}-${s4(buf[5])}${s4(buf[6])}${s4(buf[7])}`;
    }

    /**
     * Request a token, by opening a popup window to do the oauth2 login. Once
     * we receive the result in _onAuth we will close the popup.
     *
     * @param {string} authState - The authState guid to use.
     * @param {string} authNonce - The authNonce guid to use.
     * @returns {void}
     * @private
     */
    _requestToken(authState: string = '', authNonce: string = '') {
        const h = 600;
        const w = 480;

        this._popupAuthWindow
            = window.open(
                this._getAuthUrl(authState, authNonce),
                'Auth M$',
                `width=${w}, height=${h}, top=${
                    (screen.height / 2) - (h / 2)}, left=${
                    (screen.width / 2) - (w / 2)}`);
    }

    /**
     * Constructs and returns the auth URL to use for login.
     *
     * @param {string} authState - The authState guid to use.
     * @param {string} authNonce - The authNonce guid to use.
     * @returns {string} - The auth URL.
     * @private
     */
    _getAuthUrl(authState, authNonce) {
        const authParams = [
            'response_type=id_token+token',
            `client_id=${this._appClientID}`,
            `redirect_uri=${REDIRECT_URI}`,
            `scope=${MS_API_SCOPES}`,
            `state=${authState}`,
            `nonce=${authNonce}`,
            'response_mode=fragment'
        ].join('&');

        return `${AUTH_ENDPOINT}${authParams}`;
    }

    /**
     * Post message received in window. We listen for messages with type
     * 'ms-login', which will deliver the login information.
     *
     * @param {Object} event - The post message event.
     * @returns {void}
     * @private
     */
    _onPostMessage(event) {

        if (!event.data || event.data.type !== 'ms-login') {
            return;
        }

        const params = this._getParamsFromHash(event.data.hash);

        this._onAuth(params);

        if (this._popupAuthWindow) {
            this._popupAuthWindow.close();
            this._popupAuthWindow = null;
        }
    }

    /**
     * Extract the parameters from the hash part of an URL.
     *
     * @param {string} hash - The string to parse.
     * @returns {URLSearchParams}
     * @private
     */
    _getParamsFromHash(hash) {
        const params = new URLSearchParams(hash.slice(1, hash.length));

        // Get the number of seconds the token is valid for, subtract 5 minutes
        // to account for differences in clock settings and convert to ms.
        const expiresIn = (parseInt(params.get('expires_in'), 10) - 300) * 1000;
        const now = new Date();
        const expireDate = new Date(now.getTime() + expiresIn);

        params.set('tokenExpires', expireDate.getTime().toString());

        return params;
    }

    /**
     * Does nothing as we update the profile, every time we set the api state
     * to signed-in.
     *
     * @returns {function(): Promise<void>}
     */
    updateProfile(): Function {
        return () => Promise.resolve();
    }

    /**
     * Updates api state to signed in and updates the profile email.
     *
     * @returns {void}
     * @private
     */
    _updateAPIToSignedIn() {
        this._dispatch(setCalendarAPIState(CALENDAR_API_STATES.SIGNED_IN));

        const state
            = this._getState()['features/calendar-sync'].msAuthState || {};

        this._dispatch(setCalendarProfileEmail(state.userSigninName));
    }
}
