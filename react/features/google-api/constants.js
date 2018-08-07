// @flow

/**
 * The Google API scopes to request access for streaming and calendar.
 *
 * @type {Array<string>}
 */
export const GOOGLE_API_SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/calendar'
];

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
    SIGNED_IN: 2
};
