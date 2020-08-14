// @flow

import _ from 'lodash';
import type { Dispatch } from 'redux';

import { conferenceLeft, conferenceWillLeave } from '../conference/actions';
import { getCurrentConference } from '../conference/functions';
import JitsiMeetJS, { JitsiConnectionEvents } from '../lib-jitsi-meet';
import {
    getBackendSafeRoomName,
    parseURIString
} from '../util';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    CONNECTION_WILL_CONNECT,
    SET_LOCATION_URL
} from './actionTypes';
import { JITSI_CONNECTION_URL_KEY } from './constants';
import logger from './logger';

/**
 * The error structure passed to the {@link connectionFailed} action.
 *
 * Note there was an intention to make the error resemble an Error instance (to
 * the extent that jitsi-meet needs it).
 */
export type ConnectionFailedError = {

    /**
     * The invalid credentials that were used to authenticate and the
     * authentication failed.
     */
    credentials?: {

        /**
         * The XMPP user's ID.
         */
        jid: string,

        /**
         * The XMPP user's password.
         */
        password: string
    },

    /**
     * The details about the connection failed event.
     */
    details?: Object,

    /**
     * Error message.
     */
    message?: string,

    /**
     * One of {@link JitsiConnectionError} constants (defined in
     * lib-jitsi-meet).
     */
    name: string,

    /**
     * Indicates whether this event is recoverable or not.
     */
    recoverable?: boolean
};

/**
 * Opens new connection.
 *
 * @param {string} [id] - The XMPP user's ID (e.g. {@code user@server.com}).
 * @param {string} [password] - The XMPP user's password.
 * @returns {Function}
 */
export function connect(id: ?string, password: ?string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const options = _constructOptions(state);
        const { locationURL } = state['features/base/connection'];
        const { jwt } = state['features/base/jwt'];
        const connection = new JitsiMeetJS.JitsiConnection(options.appId, jwt, options);

        connection[JITSI_CONNECTION_URL_KEY] = locationURL;

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

        connection.connect({
            id,
            password
        });

        /**
         * Dispatches {@code CONNECTION_DISCONNECTED} action when connection is
         * disconnected.
         *
         * @private
         * @returns {void}
         */
        function _onConnectionDisconnected() {
            unsubscribe();
            dispatch(connectionDisconnected(connection));
        }

        /**
         * Resolves external promise when connection is established.
         *
         * @private
         * @returns {void}
         */
        function _onConnectionEstablished() {
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                _onConnectionEstablished);
            dispatch(connectionEstablished(connection, Date.now()));
        }

        /**
         * Rejects external promise when connection fails.
         *
         * @param {JitsiConnectionErrors} err - Connection error.
         * @param {string} [msg] - Error message supplied by lib-jitsi-meet.
         * @param {Object} [credentials] - The invalid credentials that were
         * used to authenticate and the authentication failed.
         * @param {string} [credentials.jid] - The XMPP user's ID.
         * @param {string} [credentials.password] - The XMPP user's password.
         * @param {Object} details - Additional information about the error.
         * @private
         * @returns {void}
         */
        function _onConnectionFailed( // eslint-disable-line max-params
                err: string,
                msg: string,
                credentials: Object,
                details: Object) {
            unsubscribe();
            dispatch(
                connectionFailed(
                    connection, {
                        credentials,
                        details,
                        name: err,
                        message: msg
                    }
                ));
        }

        /**
         * Unsubscribe the connection instance from
         * {@code CONNECTION_DISCONNECTED} and {@code CONNECTION_FAILED} events.
         *
         * @returns {void}
         */
        function unsubscribe() {
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                _onConnectionDisconnected);
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                _onConnectionFailed);
        }
    };
}

/**
 * Create an action for when the signaling connection has been lost.
 *
 * @param {JitsiConnection} connection - The {@code JitsiConnection} which
 * disconnected.
 * @private
 * @returns {{
 *     type: CONNECTION_DISCONNECTED,
 *     connection: JitsiConnection
 * }}
 */
export function connectionDisconnected(connection: Object) {
    return {
        type: CONNECTION_DISCONNECTED,
        connection
    };
}

/**
 * Create an action for when the signaling connection has been established.
 *
 * @param {JitsiConnection} connection - The {@code JitsiConnection} which was
 * established.
 * @param {number} timeEstablished - The time at which the
 * {@code JitsiConnection} which was established.
 * @public
 * @returns {{
 *     type: CONNECTION_ESTABLISHED,
 *     connection: JitsiConnection,
 *     timeEstablished: number
 * }}
 */
export function connectionEstablished(
        connection: Object, timeEstablished: number) {
    return {
        type: CONNECTION_ESTABLISHED,
        connection,
        timeEstablished
    };
}

/**
 * Create an action for when the signaling connection could not be created.
 *
 * @param {JitsiConnection} connection - The {@code JitsiConnection} which
 * failed.
 * @param {ConnectionFailedError} error - Error.
 * @public
 * @returns {{
 *     type: CONNECTION_FAILED,
 *     connection: JitsiConnection,
 *     error: ConnectionFailedError
 * }}
 */
export function connectionFailed(
        connection: Object,
        error: ConnectionFailedError) {
    const { credentials } = error;

    if (credentials && !Object.keys(credentials).length) {
        error.credentials = undefined;
    }

    return {
        type: CONNECTION_FAILED,
        connection,
        error
    };
}

/**
 * Create an action for when a connection will connect.
 *
 * @param {JitsiConnection} connection - The {@code JitsiConnection} which will
 * connect.
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
 * Constructs options to be passed to the constructor of {@code JitsiConnection}
 * based on the redux state.
 *
 * @param {Object} state - The redux state.
 * @returns {Object} The options to be passed to the constructor of
 * {@code JitsiConnection}.
 */
function _constructOptions(state) {
    // Deep clone the options to make sure we don't modify the object in the
    // redux store.
    const options = _.cloneDeep(state['features/base/config']);

    // Normalize the BOSH URL.
    let { bosh } = options;

    if (bosh) {
        const { locationURL } = state['features/base/connection'];

        if (bosh.startsWith('//')) {
            // By default our config.js doesn't include the protocol.
            bosh = `${locationURL.protocol}${bosh}`;
        } else if (bosh.startsWith('/')) {
            // Handle relative URLs, which won't work on mobile.
            const {
                protocol,
                host,
                contextRoot
            } = parseURIString(locationURL.href);

            // eslint-disable-next-line max-len
            bosh = `${protocol}//${host}${contextRoot || '/'}${bosh.substr(1)}`;
        }

        // Append room to the URL's search.
        const { room } = state['features/base/conference'];

        room && (bosh += `?room=${getBackendSafeRoomName(room)}`);

        // FIXME Remove deprecated 'bosh' option assignment at some point.
        options.serviceUrl = options.bosh = bosh;
    }

    return options;
}

/**
 * Closes connection.
 *
 * @returns {Function}
 */
export function disconnect() {
    return (dispatch: Dispatch<any>, getState: Function): Promise<void> => {
        const state = getState();

        // The conference we have already joined or are joining.
        const conference_ = getCurrentConference(state);

        // Promise which completes when the conference has been left and the
        // connection has been disconnected.
        let promise;

        // Leave the conference.
        if (conference_) {
            // In a fashion similar to JitsiConference's CONFERENCE_LEFT event
            // (and the respective Redux action) which is fired after the
            // conference has been left, notify the application about the
            // intention to leave the conference.
            dispatch(conferenceWillLeave(conference_));

            promise
                = conference_.leave()
                    .catch(error => {
                        logger.warn(
                            'JitsiConference.leave() rejected with:',
                            error);

                        // The library lib-jitsi-meet failed to make the
                        // JitsiConference leave. Which may be because
                        // JitsiConference thinks it has already left.
                        // Regardless of the failure reason, continue in
                        // jitsi-meet as if the leave has succeeded.
                        dispatch(conferenceLeft(conference_));
                    });
        } else {
            promise = Promise.resolve();
        }

        // Disconnect the connection.
        const { connecting, connection } = state['features/base/connection'];

        // The connection we have already connected or are connecting.
        const connection_ = connection || connecting;

        if (connection_) {
            promise = promise.then(() => connection_.disconnect());
        } else {
            logger.info('No connection found while disconnecting.');
        }

        return promise;
    };
}

/**
 * Sets the location URL of the application, connecton, conference, etc.
 *
 * @param {URL} [locationURL] - The location URL of the application,
 * connection, conference, etc.
 * @returns {{
 *     type: SET_LOCATION_URL,
 *     locationURL: URL
 * }}
 */
export function setLocationURL(locationURL: ?URL) {
    return {
        type: SET_LOCATION_URL,
        locationURL
    };
}
