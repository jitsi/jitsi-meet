/**
 * Enumeration with the errors for the conference.
 * @type {{string: string}}
 */
var JitsiConferenceErrors = {
    /**
     * Indicates that a password is required in order to join the conference.
     */
    PASSWORD_REQUIRED: "conference.passwordRequired",
    /**
     * Indicates that a connection error occurred when trying to join a conference.
     */
    CONNECTION_ERROR: "conference.connectionError",
    /**
     * Indicates that there is no available videobridge.
     */
    VIDEOBRIDGE_NOT_AVAILABLE: "conference.videobridgeNotAvailable"
    /**
     * Many more errors TBD here.
     */
};

module.exports = JitsiConferenceErrors;
