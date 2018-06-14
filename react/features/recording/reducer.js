import { ReducerRegistry } from '../base/redux';
import {
    CLEAR_RECORDING_SESSIONS,
    RECORDING_SESSION_UPDATED,
    SET_PENDING_RECORDING_NOTIFICATION_UID
} from './actionTypes';

const DEFAULT_STATE = {
    sessionDatas: []
};

/**
 * Reduces the Redux actions of the feature features/recording.
 */
ReducerRegistry.register('features/recording',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {

        case CLEAR_RECORDING_SESSIONS:
            return {
                ...state,
                sessionDatas: []
            };

        case RECORDING_SESSION_UPDATED:
            return {
                ...state,
                sessionDatas:
                    _updateSessionDatas(state.sessionDatas, action.sessionData)
            };

        case SET_PENDING_RECORDING_NOTIFICATION_UID:
            return {
                ...state,
                pendingNotificationUid: action.uid
            };

        default:
            return state;
        }
    });

/**
 * Updates the known information on recording sessions.
 *
 * @param {Array} sessionDatas - The current sessions in the redux store.
 * @param {Object} newSessionData - The updated session data.
 * @private
 * @returns {Array} The session datas with the updated session data added.
 */
function _updateSessionDatas(sessionDatas, newSessionData) {
    const hasExistingSessionData = sessionDatas.find(
        sessionData => sessionData.id === newSessionData.id);
    let newSessionDatas;

    if (hasExistingSessionData) {
        newSessionDatas = sessionDatas.map(sessionData => {
            if (sessionData.id === newSessionData.id) {
                return {
                    ...newSessionData
                };
            }

            // Nothing to update for this session data so pass it back in.
            return sessionData;
        });
    } else {
        // If the session data is not present, then there is nothing to update
        // and instead it needs to be added to the known session datas.
        newSessionDatas = [
            ...sessionDatas,
            { ...newSessionData }
        ];
    }

    return newSessionDatas;
}
