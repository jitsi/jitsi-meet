// @flow

import { getParticipants } from '../base/participants';

import { VIDEO_PLAYER_PARTICIPANT_NAME } from './constants';

/**
 * Validates the entered video url.
 *
 * It returns a boolean to reflect whether the url matches the youtube regex.
 *
 * @param {string} url - The entered video link.
 * @returns {boolean}
 */
export function getYoutubeLink(url: string) {
    const p = /^(?:https?:\/\/)?(?:peer\.tube\/(?:videos)\/(?:watch))\/((\w|-){36})(?:\S+)?$/;// eslint-disable-line max-len
      
    //https://peer.tube/videos/watch/ae3d7bac-e746-45cd-b4a5-a7b314f20a85

    const result = url.match(p);    
    return result ? result[1] : false;    
}


/**
 * Checks if the status is one that is actually sharing the video - playing, pause or start.
 *
 * @param {string} status - The shared video status.
 * @returns {boolean}
 */
export function isSharingStatus(status: string) {
    return [ 'playing', 'pause', 'start' ].includes(status);
}


/**
 * Returns true if there is a video being shared in the meeting.
 *
 * @param {Object | Function} stateful - The Redux state or a function that gets resolved to the Redux state.
 * @returns {boolean}
 */
export function isVideoPlaying(stateful: Object | Function): boolean {
    return Boolean(getParticipants(stateful).find(p => p.isFakeParticipant
        && p.name === VIDEO_PLAYER_PARTICIPANT_NAME)
    );
}
