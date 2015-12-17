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
     * Indicates that client must be authenticated to create the conference.
     */
    AUTHENTICATION_REQUIRED: "conference.authenticationRequired",
    /**
     * Indicates that password cannot be set for this conference.
     */
    PASSWORD_NOT_SUPPORTED: "conference.passwordNotSupported",
    /**
     * Indicates that a connection error occurred when trying to join a
     * conference.
     */
    CONNECTION_ERROR: "conference.connectionError",
    /**
     * Indicates that the conference setup failed.
     */
    SETUP_FAILED: "conference.setup_failed",
    /**
     * Indicates that there is no available videobridge.
     */
    VIDEOBRIDGE_NOT_AVAILABLE: "conference.videobridgeNotAvailable"
    /**
     * Many more errors TBD here.
     */
};

module.exports = JitsiConferenceErrors;
