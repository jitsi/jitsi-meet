import { SET_ROOM } from '../conference/actionTypes';
import { SET_JWT } from '../jwt/actionTypes';
import { JitsiConnectionErrors } from '../lib-jitsi-meet';
import ReducerRegistry from '../redux/ReducerRegistry';
import { assign, set } from '../redux/functions';

import {
    CONNECTION_DISCONNECTED,
    CONNECTION_ESTABLISHED,
    CONNECTION_FAILED,
    CONNECTION_WILL_CONNECT,
    SET_LOCATION_URL,
    SET_PREFER_VISITOR,
    SHOW_CONNECTION_INFO
} from './actionTypes';
import { ConnectionFailedError } from './types';

export interface IConnectionState {
    connecting?: any;
    connection?: {
        addFeature: Function;
        disconnect: Function;
        getJid: () => string;
        getLogs: () => Object;
        initJitsiConference: Function;
        removeFeature: Function;
    };
    error?: ConnectionFailedError;
    locationURL?: URL;
    passwordRequired?: Object;
    preferVisitor?: boolean;
    showConnectionInfo?: boolean;
    timeEstablished?: number;
}

/**
 * Reduces the Redux actions of the feature base/connection.
 */
ReducerRegistry.register<IConnectionState>(
    'features/base/connection',
    (state = {}, action): IConnectionState => {
        switch (action.type) {
        case CONNECTION_DISCONNECTED:
            return _connectionDisconnected(state, action);

        case CONNECTION_ESTABLISHED:
            return _connectionEstablished(state, action);

        case CONNECTION_FAILED:
            return _connectionFailed(state, action);

        case CONNECTION_WILL_CONNECT:
            return _connectionWillConnect(state, action);

        case SET_JWT:
            return _setJWT(state, action);

        case SET_LOCATION_URL:
            return _setLocationURL(state, action);

        case SET_PREFER_VISITOR:
            return assign(state, {
                preferVisitor: action.preferVisitor
            });

        case SET_ROOM:
            return _setRoom(state);

        case SHOW_CONNECTION_INFO:
            return _setShowConnectionInfo(state, action);
        }

        return state;
    });

/**
 * Reduces a specific Redux action CONNECTION_DISCONNECTED of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_DISCONNECTED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionDisconnected(
        state: IConnectionState,
        { connection }: { connection: Object; }) {
    const connection_ = _getCurrentConnection(state);

    if (connection_ !== connection) {
        return state;
    }

    return assign(state, {
        connecting: undefined,
        connection: undefined,
        preferVisitor: undefined,
        timeEstablished: undefined
    });
}

/**
 * Reduces a specific Redux action CONNECTION_ESTABLISHED of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_ESTABLISHED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionEstablished(
        state: IConnectionState,
        { connection, timeEstablished }: {
            connection: any;
            timeEstablished: number;
        }) {
    return assign(state, {
        connecting: undefined,
        connection,
        error: undefined,
        passwordRequired: undefined,
        timeEstablished
    });
}

/**
 * Reduces a specific Redux action CONNECTION_FAILED of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_FAILED to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionFailed(
        state: IConnectionState,
        { connection, error }: {
            connection: Object;
            error: ConnectionFailedError;
        }) {
    const connection_ = _getCurrentConnection(state);

    if (connection_ && connection_ !== connection) {
        return state;
    }

    let preferVisitor;

    if (error.name === JitsiConnectionErrors.NOT_LIVE_ERROR) {
        // we want to keep the state for the moment when the meeting is live
        preferVisitor = state.preferVisitor;
    }

    return assign(state, {
        connecting: undefined,
        connection: undefined,
        error,
        passwordRequired:
            error.name === JitsiConnectionErrors.PASSWORD_REQUIRED
                ? connection : undefined,
        preferVisitor
    });
}

/**
 * Reduces a specific Redux action CONNECTION_WILL_CONNECT of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The Redux state of the feature base/connection.
 * @param {Action} action - The Redux action CONNECTION_WILL_CONNECT to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _connectionWillConnect(
        state: IConnectionState,
        { connection }: { connection: Object; }) {
    return assign(state, {
        connecting: connection,

        // We don't care if the previous connection has been closed already,
        // because it's an async process and there's no guarantee if it'll be
        // done before the new one is established.
        connection: undefined,
        error: undefined,
        passwordRequired: undefined,
        timeEstablished: undefined
    });
}

/**
 * The current (similar to getCurrentConference in base/conference/functions.any.js)
 * connection which is {@code connection} or {@code connecting}.
 *
 * @param {IConnectionState} baseConnectionState - The current state of the
 * {@code 'base/connection'} feature.
 * @returns {JitsiConnection} - The current {@code JitsiConnection} if any.
 * @private
 */
function _getCurrentConnection(baseConnectionState: IConnectionState): IConnectionState | undefined {
    return baseConnectionState.connection || baseConnectionState.connecting;
}

/**
 * Reduces a specific redux action {@link SET_JWT} of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The redux state of the feature base/connection.
 * @param {Action} action - The Redux action SET_JWT to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _setJWT(state: IConnectionState, { preferVisitor }: { preferVisitor: boolean; }) {
    return assign(state, {
        preferVisitor
    });
}

/**
 * Reduces a specific redux action {@link SET_LOCATION_URL} of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The redux state of the feature base/connection.
 * @param {Action} action - The redux action {@code SET_LOCATION_URL} to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _setLocationURL(
        state: IConnectionState,
        { locationURL }: { locationURL?: URL; }) {
    return set(state, 'locationURL', locationURL);
}

/**
 * Reduces a specific redux action {@link SET_ROOM} of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The redux state of the feature base/connection.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _setRoom(state: IConnectionState) {
    return assign(state, {
        error: undefined,
        passwordRequired: undefined
    });
}

/**
 * Reduces a specific redux action {@link SHOW_CONNECTION_INFO} of the feature
 * base/connection.
 *
 * @param {IConnectionState} state - The redux state of the feature base/connection.
 * @param {Action} action - The redux action {@code SHOW_CONNECTION_INFO} to reduce.
 * @private
 * @returns {Object} The new state of the feature base/connection after the
 * reduction of the specified action.
 */
function _setShowConnectionInfo(
        state: IConnectionState,
        { showConnectionInfo }: { showConnectionInfo: boolean; }) {
    return set(state, 'showConnectionInfo', showConnectionInfo);
}
