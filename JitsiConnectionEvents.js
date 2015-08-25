/**
 * Enumeration with the events for the connection.
 * @type {{string: string}}
 */
var JitsiConnnectionEvents = {
    /**
     * Indicates that the connection has been failed for some reason.
     */
    CONNECTION_FAILED: "connection.connecionFailed",
    /**
     * Indicates that the connection has been established.
     */
    CONNECTION_ESTABLISHED: "connection.connecionEstablished",
    /**
     * Indicates that the connection has been disconnected.
     */
    CONNECTION_DISCONNECTED: "connection.connecionDisconnected",
    /**
     * Indicates that the perfomed action cannot be executed because the
     * connection is not in the correct state(connected, disconnected, etc.)
     */
    WRONG_STATE: "connection.wrongState"
};

module.exports = JitsiConnnectionEvents;
