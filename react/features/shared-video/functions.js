// @flow

/**
 * Validates the entered video url.
 *
 * It returns a boolean to reflect whether the url matches the youtube regex.
 *
 * @param {string} url - The entered video link.
 * @returns {boolean}
 */
export function getYoutubeLink(url) {
    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|(?:m\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;// eslint-disable-line max-len
    const result = url.match(p);

    return result ? result[1] : false;
}


/**
 * Checks if the status is one that is actually sharing the video - playing, pause or start.
 *
 * @param {string} status - The shared video status.
 * @private
 * @returns {boolean}
 */
export function isSharingStatus(status) {
    return [ 'playing', 'pause', 'start' ].includes(status);
}
