import _ from 'lodash';

import { IReduxState } from '../../app/types';
import {
    appendURLParam,
    getBackendSafeRoomName,
    parseURIString
} from '../util/uri';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    SET_LOCATION_URL
} from './actionTypes';
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
        jid: string;

        /**
         * The XMPP user's password.
         */
        password: string;
    };

    /**
     * The details about the connection failed event.
     */
    details?: Object;

    /**
     * Error message.
     */
    message?: string;

    /**
     * One of {@link JitsiConnectionError} constants (defined in
     * lib-jitsi-meet).
     */
    name: string;

    /**
     * Indicates whether this event is recoverable or not.
     */
    recoverable?: boolean;
};

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
 * Constructs options to be passed to the constructor of {@code JitsiConnection}
 * based on the redux state.
 *
 * @param {Object} state - The redux state.
 * @returns {Object} The options to be passed to the constructor of
 * {@code JitsiConnection}.
 */
export function constructOptions(state: IReduxState) {
    // Deep clone the options to make sure we don't modify the object in the
    // redux store.
    const options = _.cloneDeep(state['features/base/config']);

    let { bosh, websocket } = options;

    // TESTING: Only enable WebSocket for some percentage of users.
    if (websocket && navigator.product === 'ReactNative') {
        if ((Math.random() * 100) >= (options?.testing?.mobileXmppWsThreshold ?? 0)) {
            websocket = undefined;
        }
    }

    // Normalize the BOSH URL.
    if (bosh && !websocket) {
        const { locationURL } = state['features/base/connection'];

        if (bosh.startsWith('//')) {
            // By default our config.js doesn't include the protocol.
            bosh = `${locationURL?.protocol}${bosh}`;
        } else if (bosh.startsWith('/')) {
            // Handle relative URLs, which won't work on mobile.
            const {
                protocol,
                host,
                contextRoot
            } = parseURIString(locationURL?.href);

            bosh = `${protocol}//${host}${contextRoot || '/'}${bosh.substr(1)}`;
        }
    }

    // WebSocket is preferred over BOSH.
    const serviceUrl = websocket || bosh;

    logger.log(`Using service URL ${serviceUrl}`);

    // Append room to the URL's search.
    const { room } = state['features/base/conference'];

    if (serviceUrl && room) {
        const roomName = getBackendSafeRoomName(room);

        options.serviceUrl = appendURLParam(serviceUrl, 'room', roomName ?? '');

        if (options.websocketKeepAliveUrl) {
            options.websocketKeepAliveUrl = appendURLParam(options.websocketKeepAliveUrl, 'room', roomName ?? '');
        }
    }

    return options;
}

/**
 * Sets the location URL of the application, connection, conference, etc.
 *
 * @param {URL} [locationURL] - The location URL of the application,
 * connection, conference, etc.
 * @returns {{
 *     type: SET_LOCATION_URL,
 *     locationURL: URL
 * }}
 */
export function setLocationURL(locationURL?: URL) {
    return {
        type: SET_LOCATION_URL,
        locationURL
    };
}
