import { ReducerRegistry } from '../base/redux';

import {
    ENABLE_JANE_WAITING_AREA_PAGE,
    SET_JANE_WAITING_AREA_AUTH_STATE,
    UPDATE_REMOTE_PARTICIPANT_STATUSES
} from './actionTypes';

const DEFAULT_STATE = {
    enableJaneWaitingAreaPage: false,
    remoteParticipantsStatuses: [],
    authState: ''
};

ReducerRegistry.register(
    'features/jane-waiting-area-native', (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case ENABLE_JANE_WAITING_AREA_PAGE:
            return {
                ...state,
                enableJaneWaitingAreaPage: action.enableJaneWaitingAreaPage
            };
        case SET_JANE_WAITING_AREA_AUTH_STATE: {
            return {
                ...state,
                authState: action.value
            };
        }
        case UPDATE_REMOTE_PARTICIPANT_STATUSES: {
            return {
                ...state,
                remoteParticipantsStatuses: action.value
            };
        }

        default:
            return state;
        }
    }
);

