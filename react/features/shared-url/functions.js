// @flow

import { getParticipants } from '../base/participants';

import { SHARED_URL_PARTICIPANT_NAME } from './constants';

/**
 * Validates the entered url.
 *
 * It returns a boolean to reflect whether the url matches a website regex.
 *
 * @param {string} sharedURL - The entered url.
 * @returns {boolean}
 */
export function getSharedURL(sharedURL: string) {
    const p = /^(https?:\/\/)/;
    const result = sharedURL.match(p);

    return result ? result[1] : false;
}

/**
 * Checks if the status is one that is actually sharing the URL
 *
 * @param {string} status - The shared URL status.
 * @returns {boolean}
 */
 export function isSharingStatus(status: string) {
    return [ 'sharing' ].includes(status);
}

/**
 * Returns true if there is a URL being shared in the meeting.
 *
 * @param {Object | Function} stateful - The Redux state or a function that gets resolved to the Redux state.
 * @returns {boolean}
 */
export function isSharingURL(stateful: Object | Function): boolean {
    return Boolean(getParticipants(stateful).find(p => p.isFakeParticipant
        && p.name === SHARED_URL_PARTICIPANT_NAME)
    );
}
