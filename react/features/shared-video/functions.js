// @flow

import { getFakeParticipants } from '../base/participants';

import { VIDEO_PLAYER_PARTICIPANT_NAME, YOUTUBE_PLAYER_PARTICIPANT_NAME } from './constants';

/**
 * Validates the entered video url.
 *
 * It returns a boolean to reflect whether the url matches the youtube regex.
 *
 * @param {string} url - The entered video link.
 * @returns {string} The youtube video id if matched.
 */
export function getYoutubeId(url: string) {
    if (!url) {
        return null;
    }

    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|(?:m\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;// eslint-disable-line max-len
    const result = url.match(p);

    return result ? result[1] : null;
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
    let videoPlaying = false;

    // eslint-disable-next-line no-unused-vars
    for (const [ id, p ] of getFakeParticipants(stateful)) {
        if (p.name === VIDEO_PLAYER_PARTICIPANT_NAME || p.name === YOUTUBE_PLAYER_PARTICIPANT_NAME) {
            videoPlaying = true;
            break;
        }
    }

    return videoPlaying;
}

