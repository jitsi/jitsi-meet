/* @flow */

import type { Dispatch } from 'redux';

import { conferenceWillLeave } from '../conference';
import JitsiMeetJS, { JitsiConnectionEvents } from '../lib-jitsi-meet';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    CONNECTION_WILL_CONNECT,
    SET_DOMAIN
} from './actionTypes';

/**
 * Opens new connection.
 *
 * @returns {Function}
 */
export function connect() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const { options } = state['features/base/connection'];
        const { room } = state['features/base/conference'];
        const connection
            = new JitsiMeetJS.JitsiConnection(
                options.appId,
                options.token,
                {
                    ...options,
                    bosh:
                        options.bosh

                            // XXX The Jitsi Meet deployments require the room
                            // argument to be in lower case at the time of this
                            // writing but, unfortunately, they do not ignore
                            // case themselves.
                            + (room ? `?room=${room.toLowerCase()}` : '')
                });

        dispatch(_connectionWillConnect(connection));

        connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                _onConnectionDisconnected);
        connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                _onConnectionEstablished);
        connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                _onConnectionFailed);

        connection.connect();

        /**
         * Dispatches CONNECTION_DISCONNECTED action when connection is
         * disconnected.
         *
         * @param {string} message - Disconnect reason.
         * @returns {void}
         * @private
         */
        function _onConnectionDisconnected(message: string) {
            connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                    _onConnectionDisconnected);

            dispatch(_connectionDisconnected(connection, message));
        }

        /**
         * Resolves external promise when connection is established.
         *
         * @returns {void}
         * @private
         */
        function _onConnectionEstablished() {
            unsubscribe();
            dispatch(connectionEstablished(connection));
        }

        /**
         * Rejects external promise when connection fails.
         *
         * @param {JitsiConnectionErrors} err - Connection error.
         * @returns {void}
         * @private
         */
        function _onConnectionFailed(err) {
            unsubscribe();
            console.error('CONNECTION FAILED:', err);
            dispatch(connectionFailed(connection, err, ''));
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
                    _onConnectionEstablished);
            connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_FAILED,
                    _onConnectionFailed);
        }
    };
}

/**
 * Closes connection.
 *
 * @returns {Function}
 */
export function disconnect() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const { conference, joining } = state['features/base/conference'];
        const { connection, connecting } = state['features/base/connection'];

        // The conference we are joining or have already joined.
        const _conference = joining || conference;

        // The connection we are connecting or have already connected.
        const _connection = connecting || connection;

        // Promise which completes when the conference has been left and the
        // connection has been disconnected.
        let promise;

        // Leave the conference.
        if (_conference) {
            // In a fashion similar to JitsiConference's CONFERENCE_LEFT event
            // (and the respective Redux action) which is fired after the
            // conference has been left, notify the application about the
            // intention to leave the conference.
            dispatch(conferenceWillLeave(_conference));

            promise = _conference.leave();
        } else {
            promise = Promise.resolve();
        }

        // Disconnect the connection.
        if (_connection) {
            promise = promise.then(() => _disconnectConnection(_connection));
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
export function setDomain(domain: string) {
    return {
        type: SET_DOMAIN,
        domain
    };
}

/**
 * Create an action for when the signaling connection has been lost.
 *
 * @param {JitsiConnection} connection - The JitsiConnection which disconnected.
 * @param {string} message - Error message.
 * @private
 * @returns {{
 *     type: CONNECTION_DISCONNECTED,
 *     connection: JitsiConnection,
 *     message: string
 * }}
 */
function _connectionDisconnected(connection, message: string) {
    return {
        type: CONNECTION_DISCONNECTED,
        connection,
        message
    };
}

/**
 * Create an action for when a connection will connect.
 *
 * @param {JitsiConnection} connection - The JitsiConnection which will connect.
 * @private
 * @returns {{
 *     type: CONNECTION_WILL_CONNECT,
 *     connection: JitsiConnection
 * }}
 */
function _connectionWillConnect(connection) {
    return {
        type: CONNECTION_WILL_CONNECT,
        connection
    };
}

/**
 * Disconnects the given connection and waits for it to finish. The returned
 * promise will be resolved once the connection is fully disconnected.
 *
 * @param {JitsiConnection} connection - The JitsiConnection which will be
 * disconnected.
 * @private
 * @returns {Promise}
 */
function _disconnectConnection(connection) {
    return new Promise(resolve => {
        const listener = () => {
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                listener);
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                listener);
            resolve();
        };

        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_DISCONNECTED,
            listener);
        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_FAILED,
            listener);
        connection.disconnect();
    });
}

/**
 * Create an action for when the signaling connection has been established.
 *
 * @param {JitsiConnection} connection - The JitsiConnection which was
 * established.
 * @returns {{
 *     type: CONNECTION_ESTABLISHED,
 *     connection: JitsiConnection
 * }}
 * @public
 */
export function connectionEstablished(connection: Object) {
    return {
        type: CONNECTION_ESTABLISHED,
        connection
    };
}

/**
 * Create an action for when the signaling connection could not be created.
 *
 * @param {JitsiConnection} connection - The JitsiConnection which failed.
 * @param {string} error - Error.
 * @param {string} errorMessage - Error message.
 * @returns {{
 *     type: CONNECTION_FAILED,
 *     connection: JitsiConnection,
 *     error: string,
 *     errorMessage: string
 * }}
 * @public
 */
export function connectionFailed(
    connection: Object, error: string, errorMessage: string) {
    return {
        type: CONNECTION_FAILED,
        connection,
        error,
        errorMessage
    };
}
