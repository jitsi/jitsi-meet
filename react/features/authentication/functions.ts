import { IConfig } from '../base/config/configType';
import JitsiMeetJS from '../base/lib-jitsi-meet';


/**
 * Checks if the token for authentication is available.
 *
 * @param {Object} config - Configuration state object from store.
 * @returns {boolean}
 */
export const isTokenAuthEnabled = (config: IConfig) =>
    typeof config.tokenAuthUrl === 'string'
    && config.tokenAuthUrl.length;


/**
 * Token url.
 *
 * @param {Object} config - Configuration state object from store.
 * @returns {string}
 */
export const getTokenAuthUrl = (config: IConfig) =>
    JitsiMeetJS.util.AuthUtil.getTokenAuthUrl.bind(null,
        config.tokenAuthUrl);
