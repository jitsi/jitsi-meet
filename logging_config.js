/* eslint-disable no-unused-vars, no-var */

// Logging configuration
var loggingConfig = {
    // default log level for the app and lib-jitsi-meet
    defaultLogLevel: 'warn',

    // Option to disable LogCollector (which stores the logs on CallStats)
    // disableLogCollector: true,

    // Although these are on the same level as the {@code defaultLogLevel} atm,
    // we keep them here, as if anyone wants to change the
    // {@code defaultLogLevel} to something more verbose, keeping these 3 on a
    // less verbose level is to be considered.
    'modules/RTC/TraceablePeerConnection.js': 'warn',
    'modules/statistics/CallStats.js': 'warn',
    'modules/xmpp/strophe.util.js': 'warn'
};

/* eslint-enable no-unused-vars, no-var */

// XXX Web/React server-includes logging_config.js into index.html.
// Mobile/react-native requires it in react/features/base/logging. For the
// purposes of the latter, (try to) export loggingConfig. The following
// detection of a module system is inspired by webpack.
typeof module === 'object'
    && typeof exports === 'object'
    && (module.exports = loggingConfig);
