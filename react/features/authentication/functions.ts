import { IConfig } from '../base/config/configType';

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
 * Creates the URL pointing to JWT token authentication service. It is
 * formatted from the 'urlPattern' argument which can contain the following
 * constants:
 * '{room}' - name of the conference room passed as <tt>roomName</tt>
 * argument to this method.
 * '{roleUpgrade}' - will contain 'true' if the URL will be used for
 * the role upgrade scenario, where user connects from anonymous domain and
 * then gets upgraded to the moderator by logging-in from the popup window.
 *
 * @param {Object} config - Configuration state object from store. A URL pattern pointing to the login service.
 * @param {string} roomName - The name of the conference room for which the user will be authenticated.
 *
 * @returns {string|undefined} - The URL pointing to JWT login service or
 * <tt>undefined</tt> if the pattern stored in config is not a string and the URL can not be
 * constructed.
 */
export const getTokenAuthUrl = (config: IConfig, roomName: string | undefined) => {

    const url = config.tokenAuthUrl;

    if (typeof url !== 'string' || !roomName) {
        return undefined;
    }

    return url.replace('{room}', roomName);
};
