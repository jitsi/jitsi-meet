import { ReducerRegistry } from '../base/redux';
import {
    CLEAR_RECORDING_SESSIONS,
    RECORDING_SESSION_UPDATED,
    SET_PENDING_RECORDING_NOTIFICATION_UID,
    SET_STREAM_KEY
} from './actionTypes';

const DEFAULT_STATE = {
    pendingNotificationUids: {},
    sessionDatas: []
};

/**
 * The name of the Redux store this feature stores its state in.
 */
const STORE_NAME = 'features/recording';

/**
 * Reduces the Redux actions of the feature features/recording.
 */
ReducerRegistry.register(STORE_NAME,
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

        case SET_PENDING_RECORDING_NOTIFICATION_UID: {
            const pendingNotificationUids = {
                ...state.pendingNotificationUids
            };

            pendingNotificationUids[action.streamType] = action.uid;

            return {
                ...state,
                pendingNotificationUids
            };
        }

        case SET_STREAM_KEY:
            return {
                ...state,
                streamKey: action.streamKey
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
