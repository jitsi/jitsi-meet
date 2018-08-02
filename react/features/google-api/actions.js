/* @flow */

import {
    SET_GOOGLE_API_PROFILE,
    SET_GOOGLE_API_STATE
} from './actionTypes';
import { GOOGLE_API_STATES } from './constants';
import googleApi from './googleApi';

/**
 * Loads Google API.
 *
 * @param {string} clientId - The client ID to be used with the API library.
 * @returns {Function}
 */
export function loadGoogleAPI(clientId: string) {
    return (dispatch: Dispatch<*>) =>
        googleApi.get()
        .then(() => googleApi.initializeClient(clientId))
        .then(() => dispatch({
            type: SET_GOOGLE_API_STATE,
            googleAPIState: GOOGLE_API_STATES.LOADED }))
        .then(() => googleApi.isSignedIn())
        .then(isSignedIn => {
            if (isSignedIn) {
                dispatch({
                    type: SET_GOOGLE_API_STATE,
                    googleAPIState: GOOGLE_API_STATES.SIGNED_IN });
            }
        });
}

/**
 * Prompts the participant to sign in to the Google API Client Library.
 *
 * @returns {function(Dispatch<*>): Promise<string | never>}
 */
export function signIn() {
    return (dispatch: Dispatch<*>) => googleApi.get()
            .then(() => googleApi.signInIfNotSignedIn())
            .then(() => dispatch({
                type: SET_GOOGLE_API_STATE,
                googleAPIState: GOOGLE_API_STATES.SIGNED_IN
            }));
}

/**
 * Updates the profile data that is currently used.
 *
 * @returns {function(Dispatch<*>): Promise<string | never>}
 */
export function updateProfile() {
    return (dispatch: Dispatch<*>) => googleApi.get()
        .then(() => googleApi.signInIfNotSignedIn())
        .then(() => dispatch({
            type: SET_GOOGLE_API_STATE,
            googleAPIState: GOOGLE_API_STATES.SIGNED_IN
        }))
        .then(() => googleApi.getCurrentUserProfile())
        .then(profile => dispatch({
            type: SET_GOOGLE_API_PROFILE,
            profileEmail: profile.getEmail()
        }));
}

/**
 * Executes a request for a list of all YouTube broadcasts associated with
 * user currently signed in to the Google API Client Library.
 *
 * @returns {function(): (Promise<*>|Promise<any[] | never>)}
 */
export function requestAvailableYouTubeBroadcasts() {
    return () =>
        googleApi.requestAvailableYouTubeBroadcasts()
        .then(response => {
            // Takes in a list of broadcasts from the YouTube API,
            // removes dupes, removes broadcasts that cannot get a stream key,
            // and parses the broadcasts into flat objects.
            const broadcasts = response.result.items;

            const parsedBroadcasts = {};

            for (let i = 0; i < broadcasts.length; i++) {
                const broadcast = broadcasts[i];
                const boundStreamID = broadcast.contentDetails.boundStreamId;

                if (boundStreamID && !parsedBroadcasts[boundStreamID]) {
                    parsedBroadcasts[boundStreamID] = {
                        boundStreamID,
                        id: broadcast.id,
                        status: broadcast.status.lifeCycleStatus,
                        title: broadcast.snippet.title
                    };
                }
            }

            return Object.values(parsedBroadcasts);
        });
}

/**
 * Fetches the stream key for a YouTube broadcast and updates the internal
 * state to display the associated stream key as being entered.
 *
 * @param {string} boundStreamID - The bound stream ID associated with the
 * broadcast from which to get the stream key.
 * @returns {function(): (Promise<*>|Promise<{
 *  streamKey: (*|string),
 *  selectedBoundStreamID: *} | never>)}
 */
export function requestLiveStreamsForYouTubeBroadcast(boundStreamID: string) {
    return () =>
        googleApi.requestLiveStreamsForYouTubeBroadcast(boundStreamID)
            .then(response => {
                const broadcasts = response.result.items;
                const streamName = broadcasts
                    && broadcasts[0]
                    && broadcasts[0].cdn.ingestionInfo.streamName;
                const streamKey = streamName || '';

                return {
                    streamKey,
                    selectedBoundStreamID: boundStreamID
                };
            });
}

/**
 * Forces the Google web client application to prompt for a sign in, such as
 * when changing account, and will then fetch available YouTube broadcasts.
 *
 * @returns {function(): (Promise<*>|Promise<{
 *  streamKey: (*|string),
 *  selectedBoundStreamID: *} | never>)}
 */
export function showAccountSelection() {
    return () =>
        googleApi.showAccountSelection();
}
