// @flow

/**
 * Checks if the token for authentication is available.
 *
 * @param {Object} config - .
 * @returns {boolean}
 */
export const isTokenAuthEnabled = (config: Object) =>
    typeof config.tokenAuthUrl === 'string'
    && config.tokenAuthUrl.length;


/**
 * Token url.
 *
 * @param {Object} config - .
 * @param {Object} JitsiMeetJS - .
 * @returns {string}
 */
export const getTokenAuthUrl = (config: Object, JitsiMeetJS: Object) =>
    JitsiMeetJS.util.AuthUtil.getTokenAuthUrl.bind(null,
         config.tokenAuthUrl);
