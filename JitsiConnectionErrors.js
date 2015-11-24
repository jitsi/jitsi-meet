/**
 * Enumeration with the errors for the connection.
 * @type {{string: string}}
 */
var JitsiConnectionErrors = {
    /**
     * Indicates that a password is required in order to join the conference.
     */
    PASSWORD_REQUIRED: "connection.passwordRequired",
    /**
     * Indicates that a connection error occurred when trying to join a
     * conference.
     */
    CONNECTION_ERROR: "connection.connectionError",
    /**
     * Not specified errors.
     */
    OTHER_ERROR: "connection.otherError"
};

module.exports = JitsiConnectionErrors;
