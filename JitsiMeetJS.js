var JitsiConnection = require("./JitsiConnection");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiConnectionEvents = require("./JitsiConnectionEvents");
var JitsiConnectionErrors = require("./JitsiConnectionErrors");
var JitsiConferenceErrors = require("./JitsiConferenceErrors");
var Logger = require("jitsi-meet-logger");
var RTC = require("./modules/RTC/RTC");

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
        RTC.init(options || {});
    },
    setLogLevel: function (level) {
        Logger.setLogLevel(level);
    },
    /**
     * Creates the media tracks and returns them trough the callback.
     * @param options Object with properties / settings specifying the tracks which should be created.
     * should be created or some additional configurations about resolution for example.
     * @returns {Promise.<{Array.<JitsiTrack>}, JitsiConferenceError>} A promise that returns an array of created JitsiTracks if resolved,
     *     or a JitsiConferenceError if rejected.
     */
    createLocalTracks: function (options) {
        return RTC.obtainAudioAndVideoPermissions(options || {});
    }
};


//Setups the promise object.
window.Promise = window.Promise || require("es6-promise").polyfill();

module.exports = LibJitsiMeet;
