// @flow

/**
 * Checks if given string is youtube url.
 *
 * @param {string} url - String to check.
 * @returns {boolean}
 */
export function getYoutubeLink(url) {
    const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;// eslint-disable-line max-len


    return url.match(p) ? RegExp.$1 : false;
}
