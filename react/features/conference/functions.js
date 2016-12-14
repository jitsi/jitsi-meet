/* global APP */
import HttpConfigFetch from '../../../modules/config/HttpConfigFetch';

/**
 * Promise wrapper on obtain config method.
 * When HttpConfigFetch will be moved to React app
 * it's better to use load config instead.
 *
 * @param {string} location - URL of the domain.
 * @param {string} room - Room name.
 * @returns {Promise}
 */
export function obtainConfig(location, room) {
    return new Promise((resolve, reject) => {
        HttpConfigFetch.obtainConfig(location, room, (success, error) => {
            if (success) {
                resolve();
            } else {
                reject(error);
            }
        });
    });
}

/**
 * If JWT token data it will be used for local user settings.
 *
 * @returns {void}
 */
export function setTokenData() {
    const localUser = APP.tokenData.caller;

    if (localUser) {
        const email = localUser.getEmail();
        const avatarUrl = localUser.getAvatarUrl();
        const name = localUser.getName();

        APP.settings.setEmail((email || '').trim(), true);
        APP.settings.setAvatarUrl((avatarUrl || '').trim());
        APP.settings.setDisplayName((name || '').trim(), true);
    }
}
