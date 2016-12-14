/* global APP, JitsiMeetJS, loggingConfig */
import { isRoomValid } from '../base/conference';
import { RouteRegistry } from '../base/navigator';
import { Conference } from '../conference';
import { WelcomePage } from '../welcome';

import getTokenData from '../../../modules/tokendata/TokenData';
import settings from '../../../modules/settings/Settings';

import URLProcessor from '../../../modules/config/URLProcessor';
import JitsiMeetLogStorage from '../../../modules/util/JitsiMeetLogStorage';

// eslint-disable-next-line max-len
import KeyboardShortcut from '../../../modules/keyboardshortcut/keyboardshortcut';

const Logger = require('jitsi-meet-logger');
const LogCollector = Logger.LogCollector;


/**
 * Gets room name and domain from URL object.
 *
 * @param {URL} url - URL object.
 * @private
 * @returns {{
 *      domain: (string|undefined),
 *      room: (string|undefined)
 *  }}
 */
function _getRoomAndDomainFromUrlObject(url) {
    let domain;
    let room;

    if (url) {
        domain = url.hostname;
        room = url.pathname.substr(1);

        // Convert empty string to undefined to simplify checks.
        if (room === '') {
            room = undefined;
        }
        if (domain === '') {
            domain = undefined;
        }
    }

    return {
        domain,
        room
    };
}

/**
 * Gets conference room name and connection domain from URL.
 *
 * @param {(string|undefined)} url - URL.
 * @returns {{
 *      domain: (string|undefined),
 *      room: (string|undefined)
 *  }}
 */
export function _getRoomAndDomainFromUrlString(url) {
    // Rewrite the specified URL in order to handle special cases such as
    // hipchat.com and enso.me which do not follow the common pattern of most
    // Jitsi Meet deployments.
    if (typeof url === 'string') {
        // hipchat.com
        let regex = /^(https?):\/\/hipchat.com\/video\/call\//gi;
        let match = regex.exec(url);

        if (!match) {
            // enso.me
            regex = /^(https?):\/\/enso\.me\/(?:call|meeting)\//gi;
            match = regex.exec(url);
        }
        if (match && match.length > 1) {
            /* eslint-disable no-param-reassign, prefer-template */

            url
                = match[1] /* URL protocol */
                + '://enso.hipchat.me/'
                + url.substring(regex.lastIndex);

            /* eslint-enable no-param-reassign, prefer-template */
        }
    }

    return _getRoomAndDomainFromUrlObject(_urlStringToObject(url));
}

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Object|Function)} stateOrGetState - Redux state or Regux getState()
 * method.
 * @returns {Route}
 */
export function _getRouteToRender(stateOrGetState) {
    const state
        = typeof stateOrGetState === 'function'
        ? stateOrGetState()
        : stateOrGetState;
    const room = state['features/base/conference'].room;
    const component = isRoomValid(room) ? Conference : WelcomePage;

    return RouteRegistry.getRouteByComponent(component);
}

/**
 * Parses a string into a URL (object).
 *
 * @param {(string|undefined)} url - The URL to parse.
 * @private
 * @returns {URL}
 */
function _urlStringToObject(url) {
    let urlObj;

    if (url) {
        try {
            urlObj = new URL(url);
        } catch (ex) {
            // The return value will signal the failure & the logged
            // exception will provide the details to the developers.
            console.log(`${url} seems to be not a valid URL, but it's OK`, ex);
        }
    }

    return urlObj;
}

/**
 * Temporary solution. Later we'll get rid of global APP
 * and set its properties in redux store.
 *
 * @returns {void}
 */
export function init() {
    _setConfigParametersFromUrl();
    _initLogging();

    APP.keyboardshortcut = KeyboardShortcut;
    APP.tokenData = getTokenData();
    APP.API.init(APP.tokenData.externalAPISettings);

    APP.translation.init(settings.getLanguage());
}

/**
 * Initializes logging in the app.
 *
 * @private
 * @returns {void}
 */
function _initLogging() {
    // Adjust logging level
    configureLoggingLevels();

    // Create the LogCollector and register it as the global log transport.
    // It is done early to capture as much logs as possible. Captured logs
    // will be cached, before the JitsiMeetLogStorage gets ready (statistics
    // module is initialized).
    if (!APP.logCollector && !loggingConfig.disableLogCollector) {
        APP.logCollector = new LogCollector(new JitsiMeetLogStorage());
        Logger.addGlobalTransport(APP.logCollector);
        JitsiMeetJS.addGlobalLogTransport(APP.logCollector);
    }
}

/**
 * Adjusts the logging levels.
 *
 * @private
 * @returns {void}
 */
function configureLoggingLevels() {
    // NOTE The library Logger is separated from
    // the app loggers, so the levels
    // have to be set in two places

    // Set default logging level
    const defaultLogLevel
        = loggingConfig.defaultLogLevel || JitsiMeetJS.logLevels.TRACE;

    Logger.setLogLevel(defaultLogLevel);
    JitsiMeetJS.setLogLevel(defaultLogLevel);

    // NOTE console was used on purpose here to go around the logging
    // and always print the default logging level to the console
    console.info(`Default logging level set to: ${defaultLogLevel}`);

    // Set log level for each logger
    if (loggingConfig) {
        Object.keys(loggingConfig).forEach(loggerName => {
            if (loggerName !== 'defaultLogLevel') {
                const level = loggingConfig[loggerName];

                Logger.setLogLevelById(level, loggerName);
                JitsiMeetJS.setLogLevelById(level, loggerName);
            }
        });
    }
}

/**
 * Sets config parameters from query string.
 *
 * @private
 * @returns {void}
 */
function _setConfigParametersFromUrl() {
    URLProcessor.setConfigParametersFromUrl();
}
