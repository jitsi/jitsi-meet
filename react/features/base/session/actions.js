// @flow

import { conferenceLeft, conferenceWillLeave } from '../conference';

import { SESSION_CREATED, SESSION_FAILED, SESSION_STARTED, SESSION_TERMINATED } from './actionTypes';
import { Session } from './Session';

import type { Dispatch } from 'redux';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * FIXME.
 *
 * @returns {Function}
 */
export function endAllSessions() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const sessions = getState()['features/base/session'];

        for (const session of sessions.values()) {
            dispatch(endSession(session));
        }
    };
}

/**
 * FIXME.
 *
 * @param {Session} session - FIXME.
 * @returns {function(*): *}
 */
export function endSession(session: Session) {
    return (dispatch: Dispatch<any>) => {
        // The conference we have already joined or are joining.
        const conference_ = session.conference;

        // Promise which completes when the conference has been left and the connection has been disconnected.
        let promise;

        // Leave the conference.
        if (conference_) {
            // In a fashion similar to JitsiConference's CONFERENCE_LEFT event (and the respective Redux action) which
            // is fired after the conference has been left, notify the application about the intention to leave
            // the conference.
            dispatch(conferenceWillLeave(conference_));

            promise
                = conference_.leave()
                    .catch(error => {
                        logger.warn('JitsiConference.leave() rejected with:', error);

                        // The library lib-jitsi-meet failed to make the JitsiConference leave. Which may be because
                        // JitsiConference thinks it has already left. Regardless of the failure reason, continue in
                        // jitsi-meet as if the leave has succeeded.
                        dispatch(conferenceLeft(conference_));
                    });
        } else {
            promise = Promise.resolve();
        }

        const connection_ = session.connection;

        if (connection_) {
            promise = promise.then(() => connection_.disconnect());
        }

        return promise;
    };
}

/**
 * FIXME.
 *
 * @param {URL} locationURL - FIXME.
 * @param {string} room - FIXME.
 * @returns {{
 *     type: SESSION_CREATED,
 *     session: Session
 * }}
 */
export function createSession(locationURL: URL, room: string) {
    return {
        type: SESSION_CREATED,
        session: new Session(locationURL, room)
    };
}

/**
 * FIXME.
 *
 * @param {Session} session - FIXME.
 * @returns {{
 *     type: SESSION_FAILED,
 *     session: Session
 * }}
 */
export function sessionFailed(session: Session) {
    return {
        type: SESSION_FAILED,
        session
    };
}

/**
 * FIXME.
 *
 * @param {Session} session - FIXME.
 * @returns {{
 *     session: Session,
 *     type: string
 * }}
 */
export function sessionStarted(session: Session) {
    return {
        type: SESSION_STARTED,
        session
    };
}

/**
 * FIXME.
 *
 * @param {Session} session - FIXME.
 * @returns {{
 *     type: SESSION_TERMINATED,
 *     session: Session
 * }}
 */
export function sessionTerminated(session: Session) {
    return {
        type: SESSION_TERMINATED,
        session
    };
}
