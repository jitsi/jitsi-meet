import { GOOGLE_API_SCOPES, DISCOVERY_DOCS } from './constants';

const GOOGLE_API_CLIENT_LIBRARY_URL = 'https://apis.google.com/js/api.js';

/**
 * A promise for dynamically loading the Google API Client Library.
 *
 * @private
 * @type {Promise}
 */
let googleClientLoadPromise;

/**
 * A singleton for loading and interacting with the Google API.
 */
const googleApi = {
    /**
     * Obtains Google API Client Library, loading the library dynamically if
     * needed.
     *
     * @returns {Promise}
     */
    get() {
        const globalGoogleApi = this._getGoogleApiClient();

        if (!globalGoogleApi) {
            return this.load();
        }

        return Promise.resolve(globalGoogleApi);
    },

    /**
     * Gets the profile for the user signed in to the Google API Client Library.
     *
     * @returns {Promise}
     */
    getCurrentUserProfile() {
        return this.get()
            .then(() => this.isSignedIn())
            .then(isSignedIn => {
                if (!isSignedIn) {
                    return null;
                }

                return this._getGoogleApiClient()
                    .auth2.getAuthInstance()
                    .currentUser.get()
                    .getBasicProfile();
            });
    },

    /**
     * Sets the Google Web Client ID used for authenticating with Google and
     * making Google API requests.
     *
     * @param {string} clientId - The client ID to be used with the API library.
     * @returns {Promise}
     */
    initializeClient(clientId) {
        return this.get()
            .then(api => new Promise((resolve, reject) => {
                // setTimeout is used as a workaround for api.client.init not
                // resolving consistently when the Google API Client Library is
                // loaded asynchronously. See:
                // github.com/google/google-api-javascript-client/issues/399
                setTimeout(() => {
                    api.client.init({
                        clientId,
                        discoveryDocs: DISCOVERY_DOCS,
                        scope: GOOGLE_API_SCOPES.join(' ')
                    })
                    .then(resolve)
                    .catch(reject);
                }, 500);
            }));
    },

    /**
     * Checks whether a user is currently authenticated with Google through an
     * initialized Google API Client Library.
     *
     * @returns {Promise}
     */
    isSignedIn() {
        return this.get()
            .then(api => Boolean(api
                && api.auth2
                && api.auth2.getAuthInstance
                && api.auth2.getAuthInstance()
                && api.auth2.getAuthInstance().isSignedIn
                && api.auth2.getAuthInstance().isSignedIn.get()));
    },

    /**
     * Generates a script tag and downloads the Google API Client Library.
     *
     * @returns {Promise}
     */
    load() {
        if (googleClientLoadPromise) {
            return googleClientLoadPromise;
        }

        googleClientLoadPromise = new Promise((resolve, reject) => {
            const scriptTag = document.createElement('script');

            scriptTag.async = true;
            scriptTag.addEventListener('error', () => {
                scriptTag.remove();

                googleClientLoadPromise = null;

                reject();
            });
            scriptTag.addEventListener('load', resolve);
            scriptTag.type = 'text/javascript';

            scriptTag.src = GOOGLE_API_CLIENT_LIBRARY_URL;

            document.head.appendChild(scriptTag);
        })
            .then(() => new Promise((resolve, reject) =>
                this._getGoogleApiClient().load('client:auth2', {
                    callback: resolve,
                    onerror: reject
                })))
            .then(() => this._getGoogleApiClient());

        return googleClientLoadPromise;
    },

    /**
     * Executes a request for a list of all YouTube broadcasts associated with
     * user currently signed in to the Google API Client Library.
     *
     * @returns {Promise}
     */
    requestAvailableYouTubeBroadcasts() {
        const url = this._getURLForLiveBroadcasts();

        return this.get()
            .then(api => api.client.request(url));
    },

    /**
     * Executes a request to get all live streams associated with a broadcast
     * in YouTube.
     *
     * @param {string} boundStreamID - The bound stream ID associated with a
     * broadcast in YouTube.
     * @returns {Promise}
     */
    requestLiveStreamsForYouTubeBroadcast(boundStreamID) {
        const url = this._getURLForLiveStreams(boundStreamID);

        return this.get()
            .then(api => api.client.request(url));
    },

    /**
     * Prompts the participant to sign in to the Google API Client Library, even
     * if already signed in.
     *
     * @returns {Promise}
     */
    showAccountSelection() {
        return this.get()
            .then(api => api.auth2.getAuthInstance().signIn());
    },

    /**
     * Prompts the participant to sign in to the Google API Client Library, if
     * not already signed in.
     *
     * @returns {Promise}
     */
    signInIfNotSignedIn() {
        return this.get()
            .then(() => this.isSignedIn())
            .then(isSignedIn => {
                if (!isSignedIn) {
                    return this.showAccountSelection();
                }
            });
    },

    /**
     * Sign out from the Google API Client Library.
     *
     * @returns {Promise}
     */
    signOut() {
        return this.get()
            .then(api =>
                api.auth2
                && api.auth2.getAuthInstance
                && api.auth2.getAuthInstance()
                && api.auth2.getAuthInstance().signOut());
    },

    /**
     * Parses the google calendar entries to a known format.
     *
     * @param {Object} entry - The google calendar entry.
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
            title: entry.summary,
            location: entry.location,
            description: entry.description
        };
    },

    /**
     * Retrieves calendar entries from all available calendars.
     *
     * @param {number} fetchStartDays - The number of days to go back
     * when fetching.
     * @param {number} fetchEndDays - The number of days to fetch.
     * @returns {Promise<CalendarEntry>}
     * @private
     */
    _getCalendarEntries(fetchStartDays, fetchEndDays) {
        return this.get()
            .then(() => this.isSignedIn())
            .then(isSignedIn => {
                if (!isSignedIn) {
                    return null;
                }

                return this._getGoogleApiClient()
                    .client.calendar.calendarList.list();
            })
            .then(calendarList => {

                // no result, maybe not signed in
                if (!calendarList) {
                    return Promise.resolve();
                }

                const calendarIds
                    = calendarList.result.items.map(en => en.id);
                const promises = calendarIds.map(id => {
                    const startDate = new Date();
                    const endDate = new Date();

                    startDate.setDate(startDate.getDate() + fetchStartDays);
                    endDate.setDate(endDate.getDate() + fetchEndDays);

                    return this._getGoogleApiClient()
                        .client.calendar.events.list({
                            'calendarId': id,
                            'timeMin': startDate.toISOString(),
                            'timeMax': endDate.toISOString(),
                            'showDeleted': false,
                            'singleEvents': true,
                            'orderBy': 'startTime'
                        });
                });

                return Promise.all(promises)
                    .then(results =>
                        [].concat(...results.map(rItem => rItem.result.items)))
                    .then(entries =>
                        entries.map(e => this._convertCalendarEntry(e)));
            });
    },

    /**
     * Returns the global Google API Client Library object. Direct use of this
     * method is discouraged; instead use the {@link get} method.
     *
     * @private
     * @returns {Object|undefined}
     */
    _getGoogleApiClient() {
        return window.gapi;
    },

    /**
     * Returns the URL to the Google API endpoint for retrieving the currently
     * signed in user's YouTube broadcasts.
     *
     * @private
     * @returns {string}
     */
    _getURLForLiveBroadcasts() {
        return [
            'https://content.googleapis.com/youtube/v3/liveBroadcasts',
            '?broadcastType=all',
            '&mine=true&part=id%2Csnippet%2CcontentDetails%2Cstatus'
        ].join('');
    },

    /**
     * Returns the URL to the Google API endpoint for retrieving the live
     * streams associated with a YouTube broadcast's bound stream.
     *
     * @param {string} boundStreamID - The bound stream ID associated with a
     * broadcast in YouTube.
     * @returns {string}
     */
    _getURLForLiveStreams(boundStreamID) {
        return [
            'https://content.googleapis.com/youtube/v3/liveStreams',
            '?part=id%2Csnippet%2Ccdn%2Cstatus',
            `&id=${boundStreamID}`
        ].join('');
    }
};

export default googleApi;
