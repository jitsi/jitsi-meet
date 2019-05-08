import { APP_WILL_NAVIGATE } from '../app';
import { CONFERENCE_FAILED, CONFERENCE_JOINED, CONFERENCE_LEFT, CONFERENCE_WILL_JOIN, SET_ROOM } from '../conference';
import { CONFIG_WILL_LOAD, LOAD_CONFIG_ERROR } from '../config';
import { connect, CONNECTION_DISCONNECTED, CONNECTION_FAILED, CONNECTION_WILL_CONNECT } from '../connection';
import { MiddlewareRegistry } from '../redux';
import { createDesiredLocalTracks } from '../tracks';
import { toURLString } from '../util';

import { createSession, endAllSessions, endSession, sessionFailed, sessionStarted, sessionTerminated } from './actions';
import { SESSION_CREATED, SESSION_FAILED, SESSION_STARTED, SESSION_TERMINATED } from './actionTypes';
import { findSessionForConference, findSessionForConnection, findSessionForLocationURL } from './selectors';


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_NAVIGATE: {
        // Currently only one session is allowed at a time
        dispatch(endAllSessions());
        break;
    }
    case CONFERENCE_FAILED: {
        const { conference, error } = action;
        const { recoverable } = error;
        const session = findSessionForConference(getState(), conference);

        if (session) {
            session.conference = null;
            if (typeof recoverable === 'undefined' || recoverable === false) {
                session.conferenceFailed = true;
                if (session.connection) {
                    // The sessionFailed is expected to be dispatched from either CONNECTION_DISCONNECTED
                    // or CONNECTION_FAILED handler in this middleware. The purpose is to delay the SESSION_FAILED until
                    // the XMPP connection is properly disposed.
                    dispatch(endSession(session));
                } else {
                    dispatch(sessionFailed(session));
                }
            }
        } else {
            console.error('CONFERENCE_FAILED - no session found');
        }
        break;
    }
    case CONFERENCE_LEFT: {
        const { conference } = action;
        const session = findSessionForConference(getState(), conference);

        if (session) {
            session.conference = null;

            // If there's any existing connection wait for it to be closed first
            session.connection || dispatch(sessionTerminated(session));
        } else {
            console.error('CONFERENCE_LEFT - no session found');
        }
        break;
    }
    case CONFERENCE_JOINED: {
        const { conference } = action;
        const session = findSessionForConference(getState(), conference);

        if (session) {
            dispatch(sessionStarted(session));
        } else {
            console.error('CONFERENCE_JOINED - no session found');
        }

        break;
    }
    case CONFERENCE_WILL_JOIN: {
        const { conference } = action;
        const { connection } = conference;

        const session = findSessionForConnection(getState(), connection);

        if (session) {
            session.conference = conference;
        } else {
            console.error('CONFERENCE_WILL_JOIN - no session found');
        }
        break;
    }
    case CONFIG_WILL_LOAD: {
        const { locationURL, room } = action;

        // Move this to APP_WILL_NAVIGATE ?
        room && room.length && dispatch(createSession(locationURL, room));

        break;
    }
    case LOAD_CONFIG_ERROR: {
        const { locationURL, room } = action;

        // There won't be a session if there's no room (it happen when the config is loaded for the welcome page).
        if (room) {
            const session = findSessionForLocationURL(getState(), locationURL);

            if (session) {
                dispatch(sessionFailed(session));
            } else {
                console.error(`LOAD_CONFIG_ERROR - no session found for: ${toURLString(locationURL)}`);
            }
        }
        break;
    }
    case CONNECTION_DISCONNECTED: {
        const { connection } = action;
        const session = findSessionForConnection(getState(), connection);

        if (session) {
            session.connection = null;
            dispatch(
                session.conferenceFailed ? sessionFailed(session) : sessionTerminated(session));
        } else {
            console.error('CONNECTION_DISCONNECTED - no session found');
        }
        break;
    }
    case CONNECTION_FAILED: {
        const { connection, error } = action;
        const { recoverable } = error;
        const session = findSessionForConnection(getState(), connection);

        if (session) {
            session.connection = null;
            if (typeof recoverable === 'undefined' || recoverable === false) {
                dispatch(sessionFailed(session));
            }
        } else {
            console.error('CONNECTION_FAILED - no session found');
        }
        break;
    }
    case CONNECTION_WILL_CONNECT: {
        const { connection, locationURL } = action;
        const session = findSessionForLocationURL(getState(), locationURL);

        if (session) {
            session.connection = connection;
        } else {
            console.error(`CONNECTION_WILL_CONNECT - no session found for: ${toURLString(locationURL)}`);
        }
        break;
    }
    case SET_ROOM: {
        const { locationURL } = getState()['features/base/connection'];
        const session = findSessionForLocationURL(getState(), locationURL);

        // Web has different logic for creating the local tracks and starting the connection
        if (session && typeof APP === 'undefined') {
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        }
        break;
    }
    case SESSION_CREATED:
    case SESSION_STARTED:
    case SESSION_FAILED:
    case SESSION_TERMINATED:
        console.info(`DEBUG ${action.type} ${action.session}`);
        break;
    }

    return result;
});
