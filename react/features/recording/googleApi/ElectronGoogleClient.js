// @flow

import AbstractGoogleClient from './AbstractGoogleClient';

declare var JitsiMeetElectron: Object;

/**
 * The key to use for storing the last known access token in session storage.
 * Session storage is used to at least mitigate having to sign in to Google
 * often, by eliminating re-sign in on a reload.
 *
 * @private
 * @type {string}
 */
const SESSION_STORAGE_KEY = 'googleApiElectronToken';

/**
 * A singleton for loading and interacting with the Google API.
 *
 * @extends AbstractGoogleClient
 */
export default class ElectronGoogleClient extends AbstractGoogleClient {
    _clientId: string;

    /**
     * Initializes a new ElectronGoogleClient instance.
     */
    constructor() {
        super();

        /**
         * The Google application client ID to be used with the API library.
         */
        this._clientId = '';
    }

    /**
     * Sets the Google Web Client ID used for authenticating with Google and
     * making Google API requests.
     *
     * @param {string} clientId - The client ID to be used with the API library.
     * @returns {Promise}
     */
    initializeClientId(clientId: string): Promise<*> {
        this._clientId = clientId;

        return Promise.resolve();
    }

    /**
     * Checks whether the user is authenticated to use the Google Web Client.
     *
     * @returns {Promise}
     */
    isSignedIn(): Promise<boolean> {
        const accessToken = this._getAccessToken();

        if (!accessToken) {
            return Promise.resolve(false);
        }

        return this._validateAccessToken(accessToken)
            .then(isValid => {
                if (!isValid) {
                    this._setAccessToken('');
                }

                return isValid;
            });
    }

    /**
     * Executes a request for a list of all YouTube broadcasts associated with
     * user associated with the {@link accessToken}.
     *
     * @returns {Promise}
     */
    requestAvailableYouTubeBroadcasts() {
        const requestUrl = this._getURLForLiveBroadcasts({
            // eslint-disable-next-line camelcase
            access_token: this._getAccessToken()
        });

        return fetch(requestUrl)
            .then(res => this._mimicGoogleWebClientResponse(res));
    }

    /**
     * Executes a request to get all live streams associated with a broadcast
     * in YouTube.
     *
     * @param {string} boundStreamID - The bound stream ID associated with a
     * broadcast in YouTube.
     * @returns {Promise}
     */
    requestLiveStreamsForYouTubeBroadcast(boundStreamID: string) {
        const requestUrl = this._getURLForLiveStreams({
            // eslint-disable-next-line camelcase
            access_token: this._getAccessToken(),
            id: boundStreamID
        });

        return fetch(requestUrl)
            .then(res => this._mimicGoogleWebClientResponse(res));
    }

    /**
     * Prompts the participant to sign in Google, even if a valid access token
     * is known.
     *
     * @returns {Promise}
     */
    showAccountSelection() {
        const redirectUri = this._getRedirectUri();
        const authUrl
            = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
                this._clientId}&redirect_uri=${redirectUri}&scope=${
                this._getApiScope()}&response_type=token`;

        return this._getGoogleApiClient()
            .requestToken({
                authUrl,
                redirectUri
            })
            .then(url => this._parseAccessToken(url))
            .then(token =>
                this._validateAccessToken(token)
                    .then(isValid => {
                        if (isValid) {
                            this._setAccessToken(token);

                            return;
                        }

                        return Promise.reject();
                    }));
    }

    /**
     * Helper method to access the last known valid access token.
     *
     * @private
     * @returns {string}
     */
    _getAccessToken() {
        return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    }

    _getApiScope: () => string;

    /**
     * Returns the global object from the Electron environment which allows
     * communication with Google oauth.
     *
     * @private
     * @returns {Object}
     */
    _getGoogleApiClient(): Object {
        return JitsiMeetElectron.googleApi;
    }

    /**
     * Helper method to generate the redirect URI Google should visit after
     * successful authentication.
     *
     * @private
     * @returns {string}
     */
    _getRedirectUri() {
        return `${window.location.origin}/static/googleAuthRedirect.html`;
    }

    _getURLForLiveBroadcasts: (Object) => string;

    _getURLForLiveStreams: (Object) => string;

    /**
     * Fetches the local participant's Google profile information.
     *
     * @private
     * @returns {Promise<Object>}
     */
    _getUserProfile(): Promise<Object> {
        const accessToken = this._getAccessToken();

        if (!accessToken) {
            return Promise.resolve({});
        }

        return fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json'
            + `&access_token=${accessToken}`)
            .then(res => res.json())
            .then(res => {
                return {
                    email: res.email
                };
            });
    }

    /**
     * Callback to handle some requests to the Google API and returns a response
     * that mimics the format received from the Google Web Client.
     *
     * @param {Object} response - The response returned from the fetch request
     * to the Google API.
     * @private
     * @returns {Promise<Object>}
     */
    _mimicGoogleWebClientResponse(response: Object): Promise<Object> {
        return response.json().then(result => {
            const googleApiResponse = { result };

            return response.ok
                ? Promise.resolve(googleApiResponse)
                : Promise.reject(googleApiResponse);
        });
    }

    /**
     * Takes in a redirect URL from Google authentication and finds the access
     * token.
     *
     * @param {string} url - The redirect URL to parse.
     * @private
     * @returns {string} The access token for interacting with the Google API.
     */
    _parseAccessToken(url: string) {
        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return '';
        }

        const hashParams = parsedUrl && parsedUrl.hash.split('&');
        const accessTokenParam
            = hashParams
                && hashParams.find(param => param.includes('access_token'));
        const accessTokenStartIndex
            = accessTokenParam && accessTokenParam.indexOf('=');
        const accessTokenValue
            = accessTokenStartIndex
                && accessTokenParam
                && accessTokenParam.substring(accessTokenStartIndex + 1);

        return accessTokenValue;
    }

    /**
     * Setter for the access token to use for Google API requests.
     *
     * @param {string} newToken - The access token for Google API requests.
     * @private
     * @returns {void}
     */
    _setAccessToken(newToken: string = '') {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, newToken);
    }

    /**
     * Performs a request with Google to ensure the passed in token is valid.
     *
     * @param {string} token - The access token to check if valid.
     * @private
     * @returns {Promise<boolean>}
     */
    _validateAccessToken(token: string): Promise<boolean> {
        if (!token) {
            return Promise.resolve(false);
        }

        return fetch('https://www.googleapis.com/oauth2/v3/tokeninfo'
            + `?access_token=${token}`)
            .then(res => res.json())
            .then(res => !res.error && res.aud === this._clientId);
    }
}
