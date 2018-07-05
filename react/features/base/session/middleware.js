// @flow

import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    JITSI_CONFERENCE_URL_KEY,
    isRoomValid
} from '../../base/conference';
import {
    CONNECTION_DISCONNECTED,
    CONNECTION_FAILED,
    CONNECTION_WILL_CONNECT
} from '../../base/connection';
import {
    MiddlewareRegistry,
    toState
} from '../../base/redux';
import { parseURIString, toURLString } from '../../base/util';

import {
    SESSION_FAILED,
    SESSION_WILL_END,
    SESSION_ENDED,
    SESSION_WILL_START,
    SESSION_STARTED
} from './constants';
import { setSession } from './actions';
import { CONFIG_WILL_LOAD, LOAD_CONFIG_ERROR } from '../config';
import { getCurrentSession, getSession } from './functions';

/**
 * Middleware that maintains conference sessions. The features spans across
 * three features strictly related to the conference lifecycle.
 * The first one is the base/config which configures the session. It's
 * 'locationURL' state is used to tell what's the current conference URL the app
 * is working with. The session starts as soon as {@link CONFIG_WILL_LOAD} event
 * arrives. The {@code locationURL} instance is stored in the session to
 * associate the load config request with the session and be able to distinguish
 * between the current and outdated load config request failures. After the
 * config is loaded the lifecycle moves to the base/connection feature which
 * creates a {@code JitsiConnection} and tries to connect to the server. On
 * {@code CONNECTION_WILL_CONNECT} the connection instance is stored in the
 * session and used later to filter the events similar to what's done for
 * the load config requests. The base/conference feature adds the last part to
 * the session's lifecycle. A {@code JitsiConference} instance is stored in the
 * session on the {@code CONFERENCE_WILL_JOIN} action. A session is considered
 * alive as long as either connection or conference is available and
 * operational.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;

    switch (type) {
    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;
        const { locationURL } = store.getState()['features/base/connection'];
        const url = toURLString(locationURL);
        const session = getSession(store, url);

        if (session) {
            store.dispatch(setSession({
                url: session.url,
                conference
            }));
        } else {
            console.info(`IGNORED WILL_JOIN FOR: ${url}`);
        }
        break;
    }
    case CONFERENCE_JOINED: {
        const { conference } = action;
        const session = findSessionForConference(store, conference);
        const state = session && session.state;

        if (state === SESSION_WILL_START) {
            store.dispatch(
                setSession({

                    // Flow complains that the session can be undefined, but it
                    // can't if the state is defined.
                    // $FlowExpectedError
                    url: session.url,
                    state: SESSION_STARTED
                }));
        } else {
            // eslint-disable-next-line max-len
            console.info(`IGNORED CONF JOINED FOR: ${toURLString(conference[JITSI_CONFERENCE_URL_KEY])}`);
        }
        break;
    }
    case CONFERENCE_LEFT:
    case CONFERENCE_FAILED: {
        const { conference, error } = action;
        const session = findSessionForConference(store, conference);

        // FIXME update comments
        // XXX Certain CONFERENCE_FAILED errors are recoverable i.e. they have
        // prevented the user from joining a specific conference but the app may
        // be able to eventually join the conference. For example, the app will
        // ask the user for a password upon
        // JitsiConferenceErrors.PASSWORD_REQUIRED and will retry joining the
        // conference afterwards. Such errors are to not reach the native
        // counterpart of the External API (or at least not in the
        // fatality/finality semantics attributed to
        // conferenceFailed:/onConferenceFailed).
        if (session) {
            if (!error || isGameOver(store, session, error)) {
                if (session.connection) {
                    store.dispatch(
                        setSession({
                            url: session.url,
                            conference: undefined
                        }));
                } else {
                    store.dispatch(
                        setSession({
                            url: session.url,
                            state: error ? SESSION_FAILED : SESSION_ENDED,
                            error
                        }));
                }
            }
        } else {
            // eslint-disable-next-line max-len
            console.info(`IGNORED FAILED/LEFT for ${toURLString(conference[JITSI_CONFERENCE_URL_KEY])}`, error);
        }
        break;
    }

    // NOTE WILL_JOIN is fired on SET_ROOM
    // case CONFERENCE_WILL_JOIN:
    case CONFERENCE_WILL_LEAVE: {
        const { conference } = action;
        const url = toURLString(conference[JITSI_CONFERENCE_URL_KEY]);
        const session = findSessionForConference(store, conference);
        const state = session && session.state;

        if (state && state !== SESSION_WILL_END) {
            store.dispatch(
                setSession({

                    // Flow complains that the session can be undefined, but it
                    // can't if the state is defined.
                    // $FlowExpectedError
                    url: session.url,
                    state: SESSION_WILL_END
                }));
        } else {
            console.info(`IGNORED WILL LEAVE FOR ${url}`);
        }
        break;
    }

    case CONNECTION_WILL_CONNECT: {
        const { connection } = action;
        const { locationURL } = store.getState()['features/base/connection'];
        const url = toURLString(locationURL);
        const session = getSession(store, url);

        if (session) {
            store.dispatch(
                setSession({
                    url: session.url,
                    connection,
                    conference: undefined // Detach from the old conference
                }));
        } else {
            console.info(`IGNORED CONNECTION_WILL_CONNECT FOR: ${url}`);
        }
        break;
    }

    case CONNECTION_DISCONNECTED:
    case CONNECTION_FAILED: {
        const { connection, error } = action;
        const session = findSessionForConnection(store, connection);

        if (session) {
            // Remove connection from the session, but wait for
            // the conference to be removed as well.
            if (!error || isGameOver(store, session, error)) {
                if (session.conference) {
                    store.dispatch(
                        setSession({
                            url: session.url,
                            connection: undefined
                        }));
                } else {
                    store.dispatch(
                        setSession({
                            url: session.url,
                            state: error ? SESSION_FAILED : SESSION_ENDED,
                            error
                        }));
                }
            }
        } else {
            console.info('Ignored DISCONNECTED/FAILED for connection');
        }
        break;
    }
    case CONFIG_WILL_LOAD: {
        const { locationURL } = action;
        const url = toURLString(locationURL);
        const session = getSession(store, url);

        // The back and forth to string conversion is here, because there's no
        // guarantee that the locationURL will be the exact custom structure
        // which contains the room property.
        let { room } = parseURIString(url);

        // Validate the room
        room = isRoomValid(room) ? room : undefined;

        if (room && !session) {
            store.dispatch(
                setSession({
                    url,
                    state: SESSION_WILL_START,
                    locationURL
                }));
        } else if (room && session) {
            // Update to the new locationURL instance
            store.dispatch(
                setSession({
                    url,
                    locationURL
                }));
        } else {
            console.info(`IGNORED CFG WILL LOAD FOR ${url}`);
        }
        break;
    }
    case LOAD_CONFIG_ERROR: {
        const { error, locationURL } = action;
        const url = toURLString(locationURL);
        const session = getSession(store, url);

        if (session && session.locationURL === locationURL) {
            if (isGameOver(store, session, error)) {
                store.dispatch(
                    setSession({
                        url,
                        state: SESSION_FAILED,
                        error
                    }));
            }
        } else {
            console.info(`IGNORED LOAD_CONFIG_ERROR FOR: ${url}`);
        }
        break;
    }
    }

    return result;
});

/**
 * FIXME A session is to be terminated either when the recoverable flag is
 * explicitly set to {@code false} or if the error arrives for a session which
 * is no longer current (the app has started working with another session).
 * This can happen when a conference which is being disconnected fails in which
 * case the session needs to be ended even if the flag is not {@code false}
 * because we know that there's no fatal error handling. This is kind of
 * a contract between the fatal error feature and the session which probably
 * indicates that the fatal error detection and handling should be incorporated
 * into the session feature.
 *
 * @param {Object | Function} stateful - FIXME.
 * @param {Object} session - FIXME.
 * @param {Object} error - FIXME.
 * @returns {boolean}
 */
function isGameOver(stateful, session, error) {
    return getCurrentSession(stateful) !== session
        || error.recoverable === false;
}

/**
 * FIXME.
 *
 * @param {Object | Function} stateful - FIXME.
 * @param {JitsiConnection} connection - FIXME.
 * @returns {Object|undefined}
 */
function findSessionForConnection(stateful, connection) {
    const state = toState(stateful);

    for (const session of state['features/base/session'].values()) {
        if (session.connection === connection) {
            return session;
        }
    }

    console.info('Session not found for a connection');

    return undefined;
}

/**
 * FIXME.
 *
 * @param {Object | Function} stateful - FIXME.
 * @param {JitsiConference} conference - FIXME.
 * @returns {Object|undefined}
 */
function findSessionForConference(stateful, conference) {
    const state = toState(stateful);

    for (const session of state['features/base/session'].values()) {
        if (session.conference === conference) {
            return session;
        }
    }

    console.info('Session not found for a conference');

    return undefined;
}
