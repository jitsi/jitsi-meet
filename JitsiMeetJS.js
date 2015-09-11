var JitsiConnection = require("./JitsiConnection");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiConnectionEvents = require("./JitsiConnectionEvents");
var JitsiConnectionErrors = require("./JitsiConnectionErrors");
var JitsiConferenceErrors = require("./JitsiConferenceErrors");

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
    init: function (options) {
        require("./modules/RTC/RTC").init(options || {});
    }

}

//Setups the promise object.
window.Promise = window.Promise || require("es6-promise").polyfill();

module.exports = LibJitsiMeet;
