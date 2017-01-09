/* global APP, config */
import HttpConfigFetch from '../../../modules/config/HttpConfigFetch';
import ConferenceUrl from '../../../modules/URL/ConferenceUrl';
import BoshAddressChoice from '../../../modules/config/BoshAddressChoice';
const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * If we have an HTTP endpoint for getting config.json configured
 * we're going to read it and override properties from config.js and
 * interfaceConfig.js. If there is no endpoint we'll just
 * continue with initialization.
 * Keep in mind that if the endpoint has been configured and we fail
 * to obtain the config for any reason then the conference won't
 * start and error message will be displayed to the user.
 *
 * @returns {Function}
 */
export function obtainConfigAndInit() {
    // Skip initialization if conference is already initialized
    if (!APP.ConferenceUrl) {
        const room = APP.conference.roomName;

        if (config.configLocation) {
            const location = config.configLocation;

            obtainConfig(location, room)
                .then(_obtainConfigHandler)
                .then(_initConference)
                .catch(err => {
                    // Show obtain config error,
                    // pass the error object for report
                    APP.UI.messageHandler.openReportDialog(
                        null, 'dialog.connectError', err);
                });
        } else {
            BoshAddressChoice.chooseAddress(config, room);
            _initConference();
        }
    }
}

/**
 * Obtain config handler.
 *
 * @returns {Promise}
 * @private
 */
function _obtainConfigHandler() {
    const now = window.performance.now();

    APP.connectionTimes['configuration.fetched'] = now;
    logger.log('(TIME) configuration fetched:\t', now);

    return Promise.resolve();
}

/**
 *  Initialization of the app.
 *
 *  @returns {void}
 *  @private
 */
function _initConference() {
    setTokenData();

    // Initialize the conference URL handler
    APP.ConferenceUrl = new ConferenceUrl(window.location);
}

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
