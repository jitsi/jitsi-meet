var JitsiConnection = require("./JitsiConnection");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiConnectionEvents = require("./JitsiConnectionEvents");
var JitsiConnectionErrors = require("./JitsiConnectionErrors");
var JitsiConferenceErrors = require("./JitsiConferenceErrors");
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
    init: function (options) {
        RTC.init(options || {});
    },
    isDeviceListAvailable: function () {
        return RTC.isDeviceListAvailable();
    },
    enumerateDevices: function (callback) {
        RTC.enumerateDevices(callback);
    }
};

//Setups the promise object.
window.Promise = window.Promise || require("es6-promise").polyfill();

module.exports = LibJitsiMeet;
