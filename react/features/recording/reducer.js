import { ReducerRegistry } from '../base/redux';
import { RECORDING_SESSION_UPDATED } from './actionTypes';

const DEFAULT_STATE = {
    sessions: []
};

/**
 * Reduces the Redux actions of the feature features/recording.
 */
ReducerRegistry.register('features/recording',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case RECORDING_SESSION_UPDATED:
            return {
                ...state,
                sessions: _updateSessions(state.sessions, action.session)
            };

        default:
            return state;
        }
    });

/**
 * Updates the known information on recording sessions.
 *
 * @param {Array} sessions - The current sessions in the redux store.
 * @param {Object} newSession - The updated session data.
 * @private
 * @returns {Array} The sessions with the updated session data added.
 */
function _updateSessions(sessions, newSession) {
    const hasSession = sessions.find(session => session.id === newSession.id);

    let newSessions;

    if (hasSession) {
        newSessions = sessions.map(session => {
            if (session.id !== newSession.id) {
                return session;
            }

            return {
                ...newSession
            };
        });
    } else {
        newSessions = [
            ...sessions,
            { ...newSession }
        ];
    }

    return newSessions;
}
