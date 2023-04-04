import { IStore } from '../../app/types';
import { conferenceLeft, conferenceWillLeave } from '../conference/actions';
import { getCurrentConference } from '../conference/functions';
import JitsiMeetJS, { JitsiConnectionEvents } from '../lib-jitsi-meet';

import {
    CONNECTION_WILL_CONNECT
} from './actionTypes';
import {
    connectionDisconnected,
    connectionEstablished,
    connectionFailed,
    constructOptions
} from './actions.any';
import { JITSI_CONNECTION_URL_KEY } from './constants';
import logger from './logger';

export * from './actions.any';

/**
 * Opens new connection.
 *
 * @param {string} [id] - The XMPP user's ID (e.g. {@code user@server.com}).
 * @param {string} [password] - The XMPP user's password.
 * @returns {Function}
 */
export function connect(id?: string, password?: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const options = constructOptions(state);
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
                credentials: any,
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
 * @param {boolean} _ - Used in web.
 * @returns {Function}
 */
export function disconnect(_?: boolean) {
    /* eslint-enable @typescript-eslint/no-unused-vars */
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
