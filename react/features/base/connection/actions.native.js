/* @flow */

import type { Dispatch } from 'redux';

import { conferenceWillLeave } from '../conference';
import JitsiMeetJS from '../lib-jitsi-meet';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    SET_DOMAIN
} from './actionTypes';

const JitsiConnectionEvents = JitsiMeetJS.events.connection;

/**
 * Opens new connection.
 *
 * @returns {Function}
 */
export function connect() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const connectionOptions
            = state['features/base/connection'].connectionOptions;
        const room = state['features/base/conference'].room;
        const connection
            = new JitsiMeetJS.JitsiConnection(
                connectionOptions.appId,
                connectionOptions.token,
                {
                    ...connectionOptions,
                    bosh:
                        connectionOptions.bosh

                            // XXX The Jitsi Meet deployments require the room
                            // argument to be in lower case at the time of this
                            // writing but, unfortunately, they do not ignore
                            // case themselves.
                            + (room ? `?room=${room.toLowerCase()}` : '')
                });

        connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                connectionDisconnected);
        connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                connectionEstablished);
        connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                connectionFailed);

        connection.connect();

        /**
         * Dispatches CONNECTION_DISCONNECTED action when connection is
         * disconnected.
         *
         * @param {string} message - Disconnect reason.
         * @returns {void}
         */
        function connectionDisconnected(message: string) {
            connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                    connectionDisconnected);

            dispatch(_connectionDisconnected(connection, message));
        }

        /**
         * Resolves external promise when connection is established.
         *
         * @returns {void}
         */
        function connectionEstablished() {
            unsubscribe();
            dispatch(_connectionEstablished(connection));
        }

        /**
         * Rejects external promise when connection fails.
         *
         * @param {JitsiConnectionErrors} err - Connection error.
         * @returns {void}
         */
        function connectionFailed(err) {
            unsubscribe();
            console.error('CONNECTION FAILED:', err);
            dispatch(_connectionFailed(connection, err));
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
                    connectionEstablished);
            connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_FAILED,
                    connectionFailed);
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
 * @private
 * @returns {{
 *     type: CONNECTION_ESTABLISHED,
 *     connection: JitsiConnection
 * }}
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
 * @param {JitsiConnection} connection - The JitsiConnection which failed.
 * @param {string} error - Error message.
 * @private
 * @returns {{
 *     type: CONNECTION_FAILED,
 *     connection: JitsiConnection,
 *     error: string
 * }}
 */
function _connectionFailed(connection, error: string) {
    return {
        type: CONNECTION_FAILED,
        connection,
        error
    };
}
