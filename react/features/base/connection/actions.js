import {
    conferenceWillLeave,
    createConference
} from '../conference';
import JitsiMeetJS from '../lib-jitsi-meet';
import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    SET_DOMAIN
} from './actionTypes';
import './reducer';

const JitsiConnectionEvents = JitsiMeetJS.events.connection;

/**
 * Opens new connection.
 *
 * @returns {Promise<JitsiConnection>}
 */
export function connect() {
    return (dispatch, getState) => {
        const state = getState();
        const connectionOpts
            = state['features/base/connection'].connectionOptions;
        const room = state['features/base/conference'].room;
        const connection = new JitsiMeetJS.JitsiConnection(
            connectionOpts.appId,
            connectionOpts.token,
            {
                ...connectionOpts,
                bosh: connectionOpts.bosh + (
                    room ? `?room=${room}` : ''
                )
            }
        );

        return new Promise((resolve, reject) => {
            connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                handleConnectionDisconnected);
            connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                handleConnectionEstablished);
            connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                handleConnectionFailed);

            connection.connect();

            /**
             * Dispatches CONNECTION_DISCONNECTED action when connection is
             * disconnected.
             *
             * @param {string} message - Disconnect reason.
             * @returns {void}
             */
            function handleConnectionDisconnected(message) {
                connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                    handleConnectionDisconnected);

                dispatch(_connectionDisconnected(connection, message));
            }

            /**
             * Resolves external promise when connection is established.
             *
             * @returns {void}
             */
            function handleConnectionEstablished() {
                unsubscribe();
                resolve(connection);
            }

            /**
             * Rejects external promise when connection fails.
             *
             * @param {JitsiConnectionErrors} err - Connection error.
             * @returns {void}
             */
            function handleConnectionFailed(err) {
                unsubscribe();
                console.error('CONNECTION FAILED:', err);
                reject(err);
            }

            /**
             * Unsubscribes connection instance from CONNECTION_ESTABLISHED
             * and CONNECTION_FAILED events.
             *
             * @returns {void}
             */
            function unsubscribe() {
                connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                    handleConnectionEstablished
                );
                connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_FAILED,
                    handleConnectionFailed
                );
            }
        })
        .catch(err => dispatch(_connectionFailed(err)))
        .then(con => dispatch(_connectionEstablished(con)))
        .then(() => dispatch(createConference()));
    };
}

/**
 * Closes connection.
 *
 * @returns {Function}
 */
export function disconnect() {
    return (dispatch, getState) => {
        const state = getState();
        const conference = state['features/base/conference'].jitsiConference;
        const connection = state['features/base/connection'].jitsiConnection;

        let promise;

        // Leave the conference.
        if (conference) {
            // In a fashion similar to JitsiConference's CONFERENCE_LEFT event
            // (and the respective Redux action) which is fired after the
            // conference has been left, notify the application about the
            // intention to leave the conference.
            dispatch(conferenceWillLeave(conference));

            promise = conference.leave();
        } else {
            promise = Promise.resolve();
        }

        // Disconnect the connection.
        if (connection) {
            promise = promise.then(() => connection.disconnect());
        }

        return promise;
    };
}

/**
 * Sets connection domain.
 *
 * @param {string} domain - Domain name.
 * @returns {{
 *      type: SET_DOMAIN,
 *      domain: string
 *  }}
 */
export function setDomain(domain) {
    return {
        type: SET_DOMAIN,
        domain
    };
}

/**
 * Create an action for when the signaling connection has been lost.
 *
 * @param {JitsiConnection} connection - The JitsiConnection which was
 * disconnected.
 * @param {string} message - Error message.
 * @private
 * @returns {{
 *     type: CONNECTION_DISCONNECTED,
 *     connection: JitsiConnection,
 *     message: string
 * }}
 */
function _connectionDisconnected(connection, message) {
    return {
        type: CONNECTION_DISCONNECTED,
        connection,
        message
    };
}

/**
 * Create an action for when the signaling connection has been established.
 *
 * @param {JitsiConnection} connection - JitsiConnection instance.
 * @private
 * @returns {{type: CONNECTION_ESTABLISHED, connection: JitsiConnection}}
 */
function _connectionEstablished(connection) {
    return {
        type: CONNECTION_ESTABLISHED,
        connection
    };
}

/**
 * Create an action for when the signaling connection could not be created.
 *
 * @param {string} error - Error message.
 * @private
 * @returns {{type: CONNECTION_FAILED, error: string}}
 */
function _connectionFailed(error) {
    return {
        type: CONNECTION_FAILED,
        error
    };
}
