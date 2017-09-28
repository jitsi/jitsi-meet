import { SET_CONFERENCE_URL } from './actionTypes';

export function setConferenceURL(conferenceURL) {
    return {
        type: SET_CONFERENCE_URL,
        conferenceURL
    };
}
