/* global APP, JitsiMeetJS, loggingConfig */

import URLProcessor from '../../../modules/config/URLProcessor';
import KeyboardShortcut
    from '../../../modules/keyboardshortcut/keyboardshortcut';
import settings from '../../../modules/settings/Settings';
import getTokenData from '../../../modules/tokendata/TokenData';
import JitsiMeetLogStorage from '../../../modules/util/JitsiMeetLogStorage';

import { detectIOS, detectAndroid } from '../base/util';

// XXX We should import landing feature here in order to update router registry.
import { Landing } from '../landing';
import { Conference } from '../conference';
import { WelcomePage } from '../welcome';

const Logger = require('jitsi-meet-logger');

export { _getRoomAndDomainFromUrlString } from './functions.native';

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

    const { platform } = state['features/app'];
    const { room } = state['features/base/conference'];
    const { landingIsShown } = state['features/landing'];

    let component = isRoomValid(room) ? Conference : WelcomePage;

    // If landing was shown there is no need to show it again.
    if (platform && !landingIsShown) {
        component = detectAndroid() || detectIOS() ? Landing : component;
    }

    return RouteRegistry.getRouteByComponent(component);
}

/**
 * Temporary solution. Later we'll get rid of global APP and set its properties
 * in redux store.
 *
 * @returns {void}
 */
export function init() {
    URLProcessor.setConfigParametersFromUrl();
    _initLogging();

    APP.keyboardshortcut = KeyboardShortcut;
    APP.tokenData = getTokenData();

    // Force enable the API if jwt token is passed because most probably
    // jitsi meet is displayed inside of wrapper that will need to communicate
    // with jitsi meet.
    APP.API.init(APP.tokenData.jwt ? { forceEnable: true } : undefined);

    APP.translation.init(settings.getLanguage());
}

/**
 * Adjusts the logging levels.
 *
 * @private
 * @returns {void}
 */
function _configureLoggingLevels() {
    // NOTE The library Logger is separated from the app loggers, so the levels
    // have to be set in two places

    // Set default logging level
    const defaultLogLevel
        = loggingConfig.defaultLogLevel || JitsiMeetJS.logLevels.TRACE;

    Logger.setLogLevel(defaultLogLevel);
    JitsiMeetJS.setLogLevel(defaultLogLevel);

    // NOTE console was used on purpose here to go around the logging and always
    // print the default logging level to the console
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
 * Initializes logging in the app.
 *
 * @private
 * @returns {void}
 */
function _initLogging() {
    // Adjust logging level
    _configureLoggingLevels();

    // Create the LogCollector and register it as the global log transport. It
    // is done early to capture as much logs as possible. Captured logs will be
    // cached, before the JitsiMeetLogStorage gets ready (statistics module is
    // initialized).
    if (!APP.logCollector && !loggingConfig.disableLogCollector) {
        APP.logCollector = new Logger.LogCollector(new JitsiMeetLogStorage());
        Logger.addGlobalTransport(APP.logCollector);
        JitsiMeetJS.addGlobalLogTransport(APP.logCollector);
    }
}
