// @flow

import JitsiMeetJS from '../../../react/features/base/lib-jitsi-meet';


/**
 * Checks if the token for authentication is available.
 *
 * @param {Object} config - Configuration state object from store.
 * @returns {boolean}
 */
export const isTokenAuthEnabled = (config: Object) =>
    typeof config.tokenAuthUrl === 'string'
    && config.tokenAuthUrl.length;


/**
 * Token url.
 *
 * @param {Object} config - Configuration state object from store.
 * @returns {string}
 */
export const getTokenAuthUrl = (config: Object) =>
    JitsiMeetJS.util.AuthUtil.getTokenAuthUrl.bind(null,
         config.tokenAuthUrl);
