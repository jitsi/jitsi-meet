import {
    API_URL_BROADCAST_STREAMS,
    API_URL_LIVE_BROADCASTS,
    DISCOVERY_DOCS,
    GOOGLE_SCOPE_CALENDAR,
    GOOGLE_SCOPE_YOUTUBE
} from './constants';

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
     * @param {boolean} enableYoutube - Whether youtube scope is enabled.
     * @param {boolean} enableCalendar - Whether calendar scope is enabled.
     * @returns {Promise}
     */
    initializeClient(clientId, enableYoutube, enableCalendar) {
        return this.get()
            .then(api => new Promise((resolve, reject) => {
                const scope
                    = `${enableYoutube ? GOOGLE_SCOPE_YOUTUBE : ''} ${enableCalendar ? GOOGLE_SCOPE_CALENDAR : ''}`
                        .trim();

                // setTimeout is used as a workaround for api.client.init not
                // resolving consistently when the Google API Client Library is
                // loaded asynchronously. See:
                // github.com/google/google-api-javascript-client/issues/399
                setTimeout(() => {
                    api.client.init({
                        clientId,
                        discoveryDocs: DISCOVERY_DOCS,
                        scope
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
        return this.get()
            .then(api => api.client.request(API_URL_LIVE_BROADCASTS));
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
        return this.get()
            .then(api => api.client.request(
                `${API_URL_BROADCAST_STREAMS}${boundStreamID}`));
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
     *  calendarId: string,
     *  description: string,
     *  endDate: string,
     *  id: string,
     *  location: string,
     *  startDate: string,
     *  title: string}}
     * @private
     */
    _convertCalendarEntry(entry) {
        return {
            calendarId: entry.calendarId,
            description: entry.description,
            endDate: entry.end.dateTime,
            id: entry.id,
            location: entry.location,
            startDate: entry.start.dateTime,
            title: entry.summary,
            url: this._getConferenceDataVideoUri(entry.conferenceData)
        };
    },

    /**
     * Checks conference data for jitsi conference solution and returns
     * its video url.
     *
     * @param {Object} conferenceData - The conference data of the event.
     * @returns {string|undefined} Returns the found video uri or undefined.
     */
    _getConferenceDataVideoUri(conferenceData = {}) {
        try {
            // check conference data coming from calendar addons
            if (conferenceData.parameters.addOnParameters.parameters
                    .conferenceSolutionType === 'jitsi') {
                const videoEntry = conferenceData.entryPoints.find(
                    e => e.entryPointType === 'video');

                if (videoEntry) {
                    return videoEntry.uri;
                }
            }
        } catch (error) {
            // we don't care about undefined fields
        }
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

                // user can edit the events, so we want only those that
                // can be edited
                return this._getGoogleApiClient()
                    .client.calendar.calendarList.list();
            })
            .then(calendarList => {

                // no result, maybe not signed in
                if (!calendarList) {
                    return Promise.resolve();
                }

                const calendarIds
                    = calendarList.result.items.map(en => {
                        return {
                            id: en.id,
                            accessRole: en.accessRole
                        };
                    });
                const promises = calendarIds.map(({ id, accessRole }) => {
                    const startDate = new Date();
                    const endDate = new Date();

                    startDate.setDate(startDate.getDate() + fetchStartDays);
                    endDate.setDate(endDate.getDate() + fetchEndDays);

                    // retrieve the events and adds to the result the calendarId
                    return this._getGoogleApiClient()
                        .client.calendar.events.list({
                            'calendarId': id,
                            'timeMin': startDate.toISOString(),
                            'timeMax': endDate.toISOString(),
                            'showDeleted': false,
                            'singleEvents': true,
                            'orderBy': 'startTime'
                        })
                        .then(result => result.result.items
                            .map(item => {
                                const resultItem = { ...item };

                                // add the calendarId only for the events
                                // we can edit
                                if (accessRole === 'writer'
                                    || accessRole === 'owner') {
                                    resultItem.calendarId = id;
                                }

                                return resultItem;
                            }));
                });

                return Promise.all(promises)
                    .then(results => [].concat(...results))
                    .then(entries =>
                        entries.map(e => this._convertCalendarEntry(e)));
            });
    },

    /* eslint-disable max-params */
    /**
     * Updates the calendar event and adds a location and text.
     *
     * @param {string} id - The event id to update.
     * @param {string} calendarId - The calendar id to use.
     * @param {string} location - The location to add to the event.
     * @param {string} text - The description text to set/append.
     * @returns {Promise<T | never>}
     * @private
     */
    _updateCalendarEntry(id, calendarId, location, text) {
        return this.get()
            .then(() => this.isSignedIn())
            .then(isSignedIn => {
                if (!isSignedIn) {
                    return null;
                }

                return this._getGoogleApiClient()
                    .client.calendar.events.get({
                        'calendarId': calendarId,
                        'eventId': id
                    }).then(event => {
                        let newDescription = text;

                        if (event.result.description) {
                            newDescription = `${event.result.description}\n\n${
                                text}`;
                        }

                        return this._getGoogleApiClient()
                            .client.calendar.events.patch({
                                'calendarId': calendarId,
                                'eventId': id,
                                'description': newDescription,
                                'location': location
                            });
                    });

            });
    },
    /* eslint-enable max-params */

    /**
     * Returns the global Google API Client Library object. Direct use of this
     * method is discouraged; instead use the {@link get} method.
     *
     * @private
     * @returns {Object|undefined}
     */
    _getGoogleApiClient() {
        return window.gapi;
    }
};

export default googleApi;
