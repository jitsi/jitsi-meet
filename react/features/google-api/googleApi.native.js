import { NativeModules } from 'react-native';

let GoogleSignin;

if (NativeModules.RNGoogleSignin) {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
}

import {
    API_URL_BROADCAST_STREAMS,
    API_URL_LIVE_BROADCASTS
} from './constants';

/**
 * Class to encapsulate Google API functionalities and provide a similar
 * interface to what WEB has. The methods are different, but the point is that
 * the export object is similar so no need for different export logic.
 *
 * For more detailed documentation of the {@code GoogleSignin} API, please visit
 * https://github.com/@react-native-google-signin/google-signin.
 */
class GoogleApi {
    /**
     * Wraps the {@code GoogleSignin.configure} method.
     *
     * @param {Object} config - The config object to be passed to
     * {@code GoogleSignin.configure}.
     * @returns {void}
     */
    configure(config) {
        if (GoogleSignin) {
            GoogleSignin.configure(config);
        }
    }

    /**
     * Retrieves the current tokens.
     *
     * @returns {Promise}
     */
    getTokens() {
        return GoogleSignin.getTokens();
    }

    /**
     * Retrieves the available YouTube streams the user can use for live
     * streaming.
     *
     * @param {string} accessToken - The Google auth token.
     * @returns {Promise}
     */
    getYouTubeLiveStreams(accessToken) {
        return new Promise((resolve, reject) => {

            // Fetching the list of available broadcasts first.
            this._fetchGoogleEndpoint(accessToken,
                API_URL_LIVE_BROADCASTS)
            .then(broadcasts => {
                // Then fetching all the available live streams that the
                // user has access to with the broadcasts we retrieved
                // earlier.
                this._getLiveStreamsForBroadcasts(
                    accessToken, broadcasts).then(resolve, reject);
            }, reject);
        });
    }

    /**
     * Wraps the {@code GoogleSignin.hasPlayServices} method.
     *
     * @returns {Promise<*>}
     */
    hasPlayServices() {
        if (!GoogleSignin) {
            return Promise.reject(new Error('Google SignIn not supported'));
        }

        return GoogleSignin.hasPlayServices();
    }

    /**
     * Wraps the {@code GoogleSignin.signIn} method.
     *
     * @returns {Promise<*>}
     */
    signIn() {
        return GoogleSignin.signIn();
    }

    /**
     * Wraps the {@code GoogleSignin.signInSilently} method.
     *
     * @returns {Promise<*>}
     */
    signInSilently() {
        return GoogleSignin.signInSilently();
    }

    /**
     * Wraps the {@code GoogleSignin.signOut} method.
     *
     * @returns {Promise<*>}
     */
    signOut() {
        return GoogleSignin.signOut();
    }

    /**
     * Helper method to fetch a Google API endpoint in a generic way.
     *
     * @private
     * @param {string} accessToken - The access token used for the API call.
     * @param {string} endpoint - The endpoint to fetch, including the URL
     * params if needed.
     * @returns {Promise}
     */
    _fetchGoogleEndpoint(accessToken, endpoint) {
        return new Promise((resolve, reject) => {
            const headers = {
                Authorization: `Bearer ${accessToken}`
            };

            fetch(endpoint, {
                headers
            }).then(response => response.json())
            .then(responseJSON => {
                if (responseJSON.error) {
                    reject(responseJSON.error.message);
                } else {
                    resolve(responseJSON.items || []);
                }
            }, reject);
        });
    }

    /**
     * Retrieves the available YouTube streams that are available for the
     * provided broadcast IDs.
     *
     * @private
     * @param {string} accessToken - The Google access token.
     * @param {Array<Object>} broadcasts - The list of broadcasts that we want
     * to retrieve streams for.
     * @returns {Promise}
     */
    _getLiveStreamsForBroadcasts(accessToken, broadcasts) {
        return new Promise((resolve, reject) => {
            const ids = [];

            for (const broadcast of broadcasts) {
                broadcast.contentDetails
                    && broadcast.contentDetails.boundStreamId
                    && ids.push(broadcast.contentDetails.boundStreamId);
            }

            this._fetchGoogleEndpoint(
                accessToken,
                `${API_URL_BROADCAST_STREAMS}${ids.join(',')}`)
                .then(streams => {
                    const keys = [];

                    // We construct an array of keys bind with the broadcast
                    // name for a nice display.
                    for (const stream of streams) {
                        const key = stream.cdn.ingestionInfo.streamName;
                        let title;

                        // Finding title from the broadcast with the same
                        // boundStreamId. If not found (unknown scenario), we
                        // use the key as title again.
                        for (const broadcast of broadcasts) {
                            if (broadcast.contentDetails
                                    && broadcast.contentDetails.boundStreamId
                                        === stream.id) {
                                title = broadcast.snippet.title;
                            }
                        }

                        keys.push({
                            key,
                            title: title || key
                        });
                    }

                    resolve(keys);
                }, reject);
        });
    }
}

export default new GoogleApi();
