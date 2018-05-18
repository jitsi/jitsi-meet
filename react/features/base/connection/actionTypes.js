/**
 * The type of (redux) action which signals that a connection disconnected.
 *
 * {
 *     type: CONNECTION_DISCONNECTED,
 *     connection: JitsiConnection,
 *     message: string
 * }
 */
export const CONNECTION_DISCONNECTED = Symbol('CONNECTION_DISCONNECTED');

/**
 * The type of (redux) action which signals that a connection was successfully
 * established.
 *
 * {
 *     type: CONNECTION_ESTABLISHED,
 *     connection: JitsiConnection
 * }
 */
export const CONNECTION_ESTABLISHED = Symbol('CONNECTION_ESTABLISHED');

/**
 * The type of (redux) action which signals that a connection failed.
 *
 * {
 *     type: CONNECTION_FAILED,
 *     connection: JitsiConnection,
 *     error: Object | string
 * }
 */
export const CONNECTION_FAILED = Symbol('CONNECTION_FAILED');

/**
 * The type of (redux) action which signals that a connection will connect.
 *
 * {
 *     type: CONNECTION_WILL_CONNECT,
 *     connection: JitsiConnection
 * }
 */
export const CONNECTION_WILL_CONNECT = Symbol('CONNECTION_WILL_CONNECT');

/**
 * The type of (redux) action which sets the location URL of the application,
 * connection, conference, etc.
 *
 * {
 *     type: SET_LOCATION_URL,
 *     locationURL: ?URL
 * }
 */
export const SET_LOCATION_URL = Symbol('SET_LOCATION_URL');

/**
 * The type of (redux) action which sets the pending location URL of
 * the application, connection, conference, etc. It indicates that the process
 * of resolving a location has been started (loading config). Because that's an
 * asynchronous operation it's not know how long it may take. It may turn out
 * that a request for new location may come in before the previous one
 * has finished. The information about pending URL stored in the store is used
 * to discard any previous requests which are no longer relevant.
 *
 * {
 *     type: SET_PENDING_LOCATION_URL,
 *     pendingLocationURL: ?URL
 * }
 */
export const SET_PENDING_LOCATION_URL = Symbol('SET_PENDING_LOCATION_URL');
