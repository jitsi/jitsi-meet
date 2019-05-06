/**
 * FIXME.
 *
 * @param {Object} state - FIXME.
 * @param {JitsiConnection} connection - FIXME.
 * @returns {Session|null}
 */
export function findSessionForConnection(state, connection) {
    const sessions = state['features/base/session'];

    for (const session of sessions.values()) {
        if (session.connection === connection) {
            return session;
        }
    }

    return null;
}

/**
 * FIXME.
 *
 * @param {Object} state - FIXME.
 * @param {JitsiConference} conference - FIXME.
 * @returns {Session|null}
 */
export function findSessionForConference(state, conference) {
    const sessions = state['features/base/session'];

    for (const session of sessions.values()) {
        if (session.conference === conference) {
            return session;
        }
    }

    return null;
}

/**
 * FIXME.
 *
 * @param {Object} state - FIXME.
 * @param {URL} locationURL - FIXME.
 * @returns {Session|null}
 */
export function findSessionForLocationURL(state, locationURL) {
    const sessions = state['features/base/session'];

    for (const session of sessions.values()) {
        if (session.locationURL === locationURL) {
            return session;
        }
    }

    return null;
}
