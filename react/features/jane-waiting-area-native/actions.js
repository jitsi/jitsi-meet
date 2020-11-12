import {
    ENABLE_JANE_WAITING_AREA_PAGE,
    UPDATE_REMOTE_PARTICIPANT_STATUSES,
    SET_JANE_WAITING_AREA_AUTH_STATE
} from './actionTypes';

// eslint-disable-next-line require-jsdoc
export function enableJaneWaitingAreaPage(enableJaneWaitingAreaPage: ?boolean) {
    return {
        type: ENABLE_JANE_WAITING_AREA_PAGE,
        enableJaneWaitingAreaPage
    };
}

// eslint-disable-next-line require-jsdoc
export function setJaneWaitingAreaAuthState(value: string) {
    return {
        type: SET_JANE_WAITING_AREA_AUTH_STATE,
        value
    };
}

// eslint-disable-next-line require-jsdoc
export function updateRemoteParticipantsStatuses(remoteParticipantsStatuses) {
    return {
        type: UPDATE_REMOTE_PARTICIPANT_STATUSES,
        value: remoteParticipantsStatuses
    };
}
