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
    }

}

//Setups the promise object.
require("es6-promise").polyfill();

module.exports = LibJitsiMeet;
