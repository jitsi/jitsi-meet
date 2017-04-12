import JitsiMeetJS from '../base/lib-jitsi-meet';

const Logger = require('jitsi-meet-logger');


/**
 * Adjusts the logging levels.
 *
 * @param {Object} logConfig - Logging levels configuration.
 * @protected
 * @returns {void}
 */
export function _configureLoggingLevels(logConfig = {}) {
    // NOTE The library Logger is separated from the app loggers, so the levels
    // have to be set in two places

    // Set default logging level
    const defaultLogLevel
        = logConfig.defaultLogLevel || JitsiMeetJS.logLevels.TRACE;

    Logger.setLogLevel(defaultLogLevel);
    JitsiMeetJS.setLogLevel(defaultLogLevel);

    // NOTE console was used on purpose here to go around the logging and always
    // print the default logging level to the console
    console.info(`Default logging level set to: ${defaultLogLevel}`);

    // Set log level for each logger
    for (const loggerName in logConfig) {
        if (loggerName !== 'defaultLogLevel') {
            const level = logConfig[loggerName];

            Logger.setLogLevelById(level, loggerName);
            JitsiMeetJS.setLogLevelById(level, loggerName);
        }
    }
}
