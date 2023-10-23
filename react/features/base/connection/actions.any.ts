import _ from 'lodash';

import { IReduxState, IStore } from '../../app/types';
import { conferenceLeft, conferenceWillLeave, redirect } from '../conference/actions';
import { getCurrentConference } from '../conference/functions';
import { IConfigState } from '../config/reducer';
import JitsiMeetJS, { JitsiConnectionEvents } from '../lib-jitsi-meet';
import { parseURLParams } from '../util/parseURLParams';
import {
    appendURLParam,
    getBackendSafeRoomName
} from '../util/uri';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    CONNECTION_WILL_CONNECT,
    SET_LOCATION_URL
} from './actionTypes';
import { JITSI_CONNECTION_URL_KEY } from './constants';
import logger from './logger';
import { ConnectionFailedError, IIceServers } from './types';

/**
 * The options that will be passed to the JitsiConnection instance.
 */
interface IOptions extends IConfigState {
    iceServersOverride?: IIceServers;
    preferVisitor?: boolean;
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
export function connectionDisconnected(connection?: Object) {
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
    const options: IOptions = _.cloneDeep(state['features/base/config']);

    const { locationURL, preferVisitor } = state['features/base/connection'];
    const params = parseURLParams(locationURL || '');
    const iceServersOverride = params['iceServers.replace'];

    if (iceServersOverride) {
        options.iceServersOverride = iceServersOverride;
    }

    const { bosh, preferBosh } = options;
    let { websocket } = options;

    // TESTING: Only enable WebSocket for some percentage of users.
    if (websocket && navigator.product === 'ReactNative') {
        if ((Math.random() * 100) >= (options?.testing?.mobileXmppWsThreshold ?? 0)) {
            websocket = undefined;
        }
    }

    if (preferBosh) {
        websocket = undefined;
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
        if (options.conferenceRequestUrl) {
            options.conferenceRequestUrl = appendURLParam(options.conferenceRequestUrl, 'room', roomName ?? '');
        }
    }

    if (preferVisitor) {
        options.preferVisitor = true;
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

/**
 * Opens new connection.
 *
 * @param {string} [id] - The XMPP user's ID (e.g. {@code user@server.com}).
 * @param {string} [password] - The XMPP user's password.
 * @returns {Function}
 */
export function _connectInternal(id?: string, password?: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const options = constructOptions(state);
        const { locationURL } = state['features/base/connection'];
        const { jwt } = state['features/base/jwt'];

        const connection = new JitsiMeetJS.JitsiConnection(options.appId, jwt, options);

        connection[JITSI_CONNECTION_URL_KEY] = locationURL;

        dispatch(_connectionWillConnect(connection));

        return new Promise((resolve, reject) => {
            connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                _onConnectionDisconnected);
            connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                _onConnectionEstablished);
            connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                _onConnectionFailed);
            connection.addEventListener(
                JitsiConnectionEvents.CONNECTION_REDIRECTED,
                _onConnectionRedirected);

            /**
             * Unsubscribe the connection instance from
             * {@code CONNECTION_DISCONNECTED} and {@code CONNECTION_FAILED} events.
             *
             * @returns {void}
             */
            function unsubscribe() {
                connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_DISCONNECTED, _onConnectionDisconnected);
                connection.removeEventListener(JitsiConnectionEvents.CONNECTION_FAILED, _onConnectionFailed);
            }

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
                resolve(connection);
            }

            /**
             * Rejects external promise when connection fails.
             *
             * @param {JitsiConnectionErrors} err - Connection error.
             * @param {string} [message] - Error message supplied by lib-jitsi-meet.
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
                    message: string,
                    credentials: any,
                    details: Object) {
                unsubscribe();

                dispatch(connectionFailed(connection, {
                    credentials,
                    details,
                    name: err,
                    message
                }));

                reject(err);
            }

            /**
             * Resolves external promise when connection is established.
             *
             * @private
             * @returns {void}
             */
            function _onConnectionEstablished() {
                connection.removeEventListener(JitsiConnectionEvents.CONNECTION_ESTABLISHED, _onConnectionEstablished);
                dispatch(connectionEstablished(connection, Date.now()));
                resolve(connection);
            }

            /**
             * Rejects external promise when connection fails.
             *
             * @param {string|undefined} vnode - The vnode to connect to.
             * @param {string} focusJid - The focus jid to use.
             * @param {string|undefined} username - The username to use when joining. This is after promotion from
             * visitor to main participant.
             * @private
             * @returns {void}
             */
            function _onConnectionRedirected(vnode: string, focusJid: string, username: string) {
                connection.removeEventListener(JitsiConnectionEvents.CONNECTION_REDIRECTED, _onConnectionRedirected);
                dispatch(redirect(vnode, focusJid, username));
            }

            // in case of configured http url for conference request we need the room name
            const name = getBackendSafeRoomName(state['features/base/conference'].room);

            connection.connect({
                id,
                password,
                name
            });
        });
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
function _connectionWillConnect(connection: Object) {
    return {
        type: CONNECTION_WILL_CONNECT,
        connection
    };
}

/**
 * Closes connection.
 *
 * @returns {Function}
 */
export function disconnect() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']): Promise<void> => {
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
                .catch((error: Error) => {
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
