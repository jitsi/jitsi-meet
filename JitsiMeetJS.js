var JitsiConnection = require("./JitsiConnection");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiConnectionEvents = require("./JitsiConnectionEvents");
var JitsiConnectionErrors = require("./JitsiConnectionErrors");
var JitsiConferenceErrors = require("./JitsiConferenceErrors");
var Logger = require("jitsi-meet-logger");

/**
 * Namespace for the interface of Jitsi Meet Library.
 */
var LibJitsiMeet = {

    JitsiConnection: JitsiConnection,
    events: {
        conference: JitsiConferenceEvents,
        connection: JitsiConnectionEvents
    },
    errors: {
        conference: JitsiConferenceErrors,
        connection: JitsiConnectionErrors
    },
    logLevels: Logger.levels,
    init: function (options) {
        require("./modules/RTC/RTC").init(options || {});
    },
    setLogLevel: function (level) {
        Logger.setLogLevel(level);
    }
};


//Setups the promise object.
window.Promise = window.Promise || require("es6-promise").polyfill();

module.exports = LibJitsiMeet;
