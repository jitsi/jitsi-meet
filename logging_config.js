/* eslint-disable no-unused-vars, no-var */
// Logging configuration
// XXX When making any changes to this file make sure to also update it's React
// version at ./react/features/base/logging/reducer.js !!!
var loggingConfig = {
    // default log level for the app and lib-jitsi-meet
    defaultLogLevel: 'trace',

    // Option to disable LogCollector (which stores the logs on CallStats)
    // disableLogCollector: true,

    // The following are too verbose in their logging with the
    // {@link #defaultLogLevel}:
    'modules/statistics/CallStats.js': 'info',
    'modules/xmpp/strophe.util.js': 'log',
    'modules/RTC/TraceablePeerConnection.js': 'info'
};

/* eslint-enable no-unused-vars, no-var */
