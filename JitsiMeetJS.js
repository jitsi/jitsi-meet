var Connection = require("./Connection");
var ConferenceEvents = require("./ConferenceEvents");

/**
 * Namespace for the interface of Jitsi Meet Library.
 */
var LibJitsiMeet = {

    Connection: Connection,
    events: {
        conference: ConferenceEvents
    }

}

module.exports = LibJitsiMeet;
