/* eslint-disable no-unused-vars, no-var */

// Logging configuration
var loggingConfig = {
    // default log level for the app and lib-jitsi-meet
    defaultLogLevel: 'trace',

    // Option to disable LogCollector (which stores the logs on CallStats)
    // disableLogCollector: true,

    // The following are too verbose in their logging with the
    // {@link #defaultLogLevel}:
    'modules/RTC/TraceablePeerConnection.js': 'info',
    'modules/statistics/CallStats.js': 'info',
    'modules/xmpp/strophe.util.js': 'log'
};

/* eslint-enable no-unused-vars, no-var */

// XXX Web/React server-includes logging_config.js into index.html.
// Mobile/react-native requires it in react/features/base/logging. For the
// purposes of the latter, (try to) export loggingConfig. The following
// detection of a module system is inspired by webpack.
typeof module === 'object'
    && typeof exports === 'object'
    && (module.exports = loggingConfig);
