/* global APP, config */

import ConferenceUrl from '../../../modules/URL/ConferenceUrl';

import { chooseBOSHAddress, obtainConfig } from '../base/config';
import { RouteRegistry } from '../base/react';

import { Conference } from './components';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Register route for Conference (page).
 */
RouteRegistry.register({
    component: Conference,
    onEnter: () => {
        // XXX If config or jwt are set by hash or query parameters
        // Getting raw URL before stripping it.
        _obtainConfigAndInit();
    },
    path: '/:room'
});

/**
 * Initialization of the app.
 *
 * @private
 * @returns {void}
 */
function _initConference() {
    _setTokenData();

    // Initialize the conference URL handler
    APP.ConferenceUrl = new ConferenceUrl(window.location);
}

/**
 * Promise wrapper on obtain config method. When HttpConfigFetch will be moved
 * to React app it's better to use load config instead.
 *
 * @param {string} location - URL of the domain from which the config is to be
 * obtained.
 * @param {string} room - Room name.
 * @private
 * @returns {Promise}
 */
function _obtainConfig(location, room) {
    return new Promise((resolve, reject) =>
        obtainConfig(location, room, (success, error) => {
            success ? resolve() : reject(error);
        })
    );
}

/**
 * If we have an HTTP endpoint for getting config.json configured we're going to
 * read it and override properties from config.js and interfaceConfig.js. If
 * there is no endpoint we'll just continue with initialization. Keep in mind
 * that if the endpoint has been configured and we fail to obtain the config for
 * any reason then the conference won't start and error message will be
 * displayed to the user.
 *
 * @private
 * @returns {void}
 */
function _obtainConfigAndInit() {
    // Skip initialization if conference is initialized already.
    if (typeof APP !== 'undefined' && !APP.ConferenceUrl) {
        const location = config.configLocation;
        const room = APP.conference.roomName;

        if (location) {
            _obtainConfig(location, room)
                .then(() => {
                    _obtainConfigHandler();
                    _initConference();
                })
                .catch(err => {
                    // Show obtain config error.
                    APP.UI.messageHandler.openReportDialog(
                        null,
                        'dialog.connectError',
                        err);
                });
        } else {
            chooseBOSHAddress(config, room);
            _initConference();
        }
    }
}

/**
 * Obtain config handler.
 *
 * @private
 * @returns {Promise}
 */
function _obtainConfigHandler() {
    const now = window.performance.now();

    APP.connectionTimes['configuration.fetched'] = now;
    logger.log('(TIME) configuration fetched:\t', now);
}

/**
 * If JWT token data it will be used for local user settings.
 *
 * @private
 * @returns {void}
 */
function _setTokenData() {
    const state = APP.store.getState();
    const { caller } = state['features/jwt'];

    if (caller) {
        const { avatarUrl, email, name } = caller;

        APP.settings.setEmail((email || '').trim(), true);
        APP.settings.setAvatarUrl((avatarUrl || '').trim());
        APP.settings.setDisplayName((name || '').trim(), true);
    }
}
