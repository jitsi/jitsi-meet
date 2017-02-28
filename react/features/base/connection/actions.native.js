/* @flow */

import type { Dispatch } from 'redux';

import { conferenceWillLeave } from '../conference';
import JitsiMeetJS, { JitsiConnectionEvents } from '../lib-jitsi-meet';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
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
        const conference = state['features/base/conference'].conference;
        const connection = state['features/base/connection'].connection;

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
