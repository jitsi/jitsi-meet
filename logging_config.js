/* eslint-disable no-unused-vars, no-var */
// Logging configuration
var loggingConfig = {
    // default log level for the app and lib-jitsi-meet
    defaultLogLevel: 'trace',

    // Option to disable LogCollector (which stores the logs on CallStats)
    // disableLogCollector: true,

    // Logging level adjustments for verbose modules:
    'modules/xmpp/strophe.util.js': 'log',
    'modules/statistics/CallStats.js': 'info'
};

/* eslint-enable no-unused-vars, no-var */
