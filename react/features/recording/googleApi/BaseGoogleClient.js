
const LIVE_BROADCASTS_ENDPOINT = [
    'https://content.googleapis.com/youtube/v3/liveBroadcasts',
    '?broadcastType=all',
    '&mine=true&part=id%2Csnippet%2CcontentDetails%2Cstatus'
].join('');

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
export default class BaseGoogleClient {
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
    _addQueryParamsToUrl(baseUrl, queryParams) {
        return Object.entries(queryParams).reduce(
            (acc, [ key, value ]) => `${acc}&${key}=${value}`,
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
     * Returns the URL to the Google API endpoint for retrieving the currently
     * signed in user's YouTube broadcasts.
     *
     * @param {Object} queryParams - Additional query string parameters to add
     * to the URL.
     * @private
     * @returns {string}
     */
    _getURLForLiveBroadcasts(queryParams = {}) {
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
    _getURLForLiveStreams(queryParams = {}) {
        return this._addQueryParamsToUrl(LIVE_STREAM_ENDPOINT, queryParams);
    }
}
