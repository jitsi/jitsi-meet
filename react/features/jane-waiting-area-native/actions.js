/* eslint-disable require-jsdoc*/

import {
    ENABLE_JANE_WAITING_AREA_PAGE,
    UPDATE_REMOTE_PARTICIPANT_STATUSES,
    SET_JANE_WAITING_AREA_AUTH_STATE
} from './actionTypes';

export function enableJaneWaitingArea(janeWaitingAreaEnabled) {
    return {
        type: ENABLE_JANE_WAITING_AREA_PAGE,
        janeWaitingAreaEnabled
    };
}

export function setJaneWaitingAreaAuthState(value) {
    return {
        type: SET_JANE_WAITING_AREA_AUTH_STATE,
        value
    };
}

export function updateRemoteParticipantsStatuses(remoteParticipantsStatuses) {
    return {
        type: UPDATE_REMOTE_PARTICIPANT_STATUSES,
        value: remoteParticipantsStatuses
    };
}
