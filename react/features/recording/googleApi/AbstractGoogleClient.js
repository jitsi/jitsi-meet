// @flow

/**
 * The API endpoint for getting broadcasts associated with a YouTube account.
 *
 * @private
 * @type {string}
 */
const LIVE_BROADCASTS_ENDPOINT = [
    'https://content.googleapis.com/youtube/v3/liveBroadcasts',
    '?broadcastType=all',
    '&mine=true&part=id%2Csnippet%2CcontentDetails%2Cstatus'
].join('');

/**
 * The API endpoint for obtaining stream information for a YouTube broadcast.
 *
 * @private
 * @type {string}
 */
const LIVE_STREAM_ENDPOINT = [
    'https://content.googleapis.com/youtube/v3/liveStreams',
    '?part=id%2Csnippet%2Ccdn%2Cstatus'
].join('');

/**
 * The account permissions to request access to from Google.
 *
 * @private
 * @type {string}
 */
const SCOPE = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'profile',
    'email'
].join(' ');

/**
 * A class for accessing the Google API. Provides common functionality to be
 * shared with concrete implementations.
 */
export default class AbstractGoogleClient {
    /**
     * Obtains Google API Client Library, loading the library dynamically if
     * needed.
     *
     * @returns {Promise}
     */
    get(): Promise<*> {
        const globalGoogleApi = this._getGoogleApiClient();

        if (!globalGoogleApi) {
            return this._load();
        }

        return Promise.resolve(globalGoogleApi);
    }

    /**
     * Gets the profile for the user signed in to the Google API Client Library.
     *
     * @returns {Promise}
     */
    getCurrentUserProfile(): Promise<*> {
        return this.get()
            .then(() => this.isSignedIn())
            .then(isSignedIn => {
                if (!isSignedIn) {
                    return null;
                }

                return this._getUserProfile();
            });
    }

    /**
     * Checks whether a user is currently authenticated with Google.
     *
     * @returns {Promise}
     */
    isSignedIn(): Promise<*> {
        // To be implemented by subclass.

        return Promise.resolve();
    }

    /**
     * Prompts the participant to sign in to the Google API Client Library, even
     * if already signed in.
     *
     * @returns {Promise}
     */
    showAccountSelection(): Promise<*> {
        // To be implemented by subclass.

        return Promise.resolve();
    }

    /**
     * Prompts the participant to sign in to acess the Google API, if not
     * already signed in.
     *
     * @returns {Promise}
     */
    signInIfNotSignedIn(): Promise<*> {
        return this.get()
            .then(() => this.isSignedIn())
            .then(isSignedIn => {
                if (!isSignedIn) {
                    return this.showAccountSelection();
                }
            });
    }

    /**
     * Appends an object as query string parameters to a URL.
     *
     * @param {string} baseUrl - The URL that will have query params additional
     * query params added.
     * @param {Object} queryParams - The query string parameters that should be
     * added to the URL.
     * @private
     * @returns {string}
     */
    _addQueryParamsToUrl(baseUrl: string, queryParams: Object) {
        return Object.keys(queryParams).reduce(
            (acc, key) => `${acc}&${key}=${queryParams[key]}`,
            baseUrl);
    }

    /**
     * Returns the account permissions to request access to from Google.
     *
     * @private
     * @returns {string}
     */
    _getApiScope() {
        return SCOPE;
    }

    /**
     * Returns the global Google API Client Library object. Direct use of this
     * method is discouraged; instead use the {@link get} method.
     *
     * @private
     * @returns {Object|undefined}
     */
    _getGoogleApiClient() {
        // To be implemented by subclass.
    }

    /**
     * Returns the URL to the Google API endpoint for retrieving the currently
     * signed in user's YouTube broadcasts.
     *
     * @param {Object} queryParams - Additional query string parameters to add
     * to the URL.
     * @private
     * @returns {string}
     */
    _getURLForLiveBroadcasts(queryParams: Object = {}) {
        return this._addQueryParamsToUrl(LIVE_BROADCASTS_ENDPOINT, queryParams);
    }

    /**
     * Returns the URL to the Google API endpoint for retrieving the live
     * streams associated with a YouTube broadcast's bound stream.
     *
     * @param {Object} queryParams - Additional query string parameters to add
     * to the URL.
     * @param {string} queryParams.id - The bound stream ID associated with a
     * broadcast in YouTube.
     * @returns {string}
     */
    _getURLForLiveStreams(queryParams: Object = {}) {
        return this._addQueryParamsToUrl(LIVE_STREAM_ENDPOINT, queryParams);
    }

    /**
     * Fetches the local participant's Google profile information.
     *
     * @private
     * @returns {Promise<Object>}
     */
    _getUserProfile(): Promise<*> {
        // To be implemented by subclass.

        return Promise.resolve();
    }

    /**
     * Externally load the library for accessing the Google API.
     *
     * @private
     * @returns {Promise}
     */
    _load(): Promise<*> {
        // To be implemented by subclass.

        return Promise.resolve();
    }
}
