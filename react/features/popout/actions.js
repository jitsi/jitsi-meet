import {
    OPEN_POPOUT,
    CLOSE_POPOUT,
    SET_POPOUT_DISPLAY_MODE,
} from "./actionTypes";

export function openPopout(participantId) {
    return {
        type: OPEN_POPOUT,
        participantId,
        popout: null,
    };
}

export function closePopout(participantId) {
    return {
        type: CLOSE_POPOUT,
        participantId,
    };
}

export function setPopoutDisplayMode(participantId, displayMode) {
    return {
        type: SET_POPOUT_DISPLAY_MODE,
        participantId,
        displayMode,
    };
}
