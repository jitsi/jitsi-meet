// @flow

/**
 * Google API URL to retreive streams for a live broadcast of a user.
 *
 * NOTE: The URL must be appended by a broadcast ID returned by a call towards
 * {@code API_URL_LIVE_BROADCASTS}.
 *
 * @type {string}
 */
// eslint-disable-next-line max-len
export const API_URL_BROADCAST_STREAMS = 'https://content.googleapis.com/youtube/v3/liveStreams?part=id%2Csnippet%2Ccdn%2Cstatus&id=';

/**
 * Google API URL to retreive live broadcasts of a user.
 *
 * @type {string}
 */
// eslint-disable-next-line max-len
export const API_URL_LIVE_BROADCASTS = 'https://content.googleapis.com/youtube/v3/liveBroadcasts?broadcastType=all&mine=true&part=id%2Csnippet%2CcontentDetails%2Cstatus';

/**
 * Array of API discovery doc URLs for APIs used by the googleApi.
 *
 * @type {string[]}
 */
export const DISCOVERY_DOCS
    = [ 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest' ];

/**
 * An enumeration of the different states the Google API can be in.
 *
 * @private
 * @type {Object}
 */
export const GOOGLE_API_STATES = {
    /**
     * The state in which the Google API still needs to be loaded.
     */
    NEEDS_LOADING: 0,

    /**
     * The state in which the Google API is loaded and ready for use.
     */
    LOADED: 1,

    /**
     * The state in which a user has been logged in through the Google API.
     */
    SIGNED_IN: 2,

    /**
     * The state in which the Google authentication is not available (e.g. Play
     * services are not installed on Android).
     */
    NOT_AVAILABLE: 3
};

/**
 * Google API auth scope to access Google calendar.
 *
 * @type {string}
 */
export const GOOGLE_SCOPE_CALENDAR = 'https://www.googleapis.com/auth/calendar';

/**
 * Google API auth scope to access YouTube streams.
 *
 * @type {string}
 */
export const GOOGLE_SCOPE_YOUTUBE
    = 'https://www.googleapis.com/auth/youtube.readonly';
