// @flow
/* eslint-disable require-jsdoc,camelcase*/
import { createLocalTrack } from '../base/lib-jitsi-meet';

import {
    ADD_JANE_WAITING_AREA_AUDIO_TRACK,
    ADD_JANE_WAITING_AREA_CONTENT_SHARING_TRACK,
    ADD_JANE_WAITING_AREA_VIDEO_TRACK,
    JANE_WAITING_AREA_START_CONFERENCE,
    SET_DEVICE_STATUS,
    SET_JANE_WAITING_AREA_AUDIO_DISABLED,
    SET_JANE_WAITING_AREA_AUDIO_MUTED,
    SET_JANE_WAITING_AREA_DEVICE_ERRORS,
    SET_JANE_WAITING_AREA_PAGE_VISIBILITY,
    SET_JANE_WAITING_AREA_VIDEO_DISABLED,
    SET_JANE_WAITING_AREA_VIDEO_MUTED,
    CONNECT_JANE_SOCKET_SERVER,
    UPDATE_REMOTE_PARTICIPANT_STATUSES,
    SET_JANE_WAITING_AREA_AUTH_STATE
} from './actionTypes';
import {
    detectLegacyMobileApp,
    getAudioTrack,
    getVideoTrack, hasRemoteParticipantInBeginStatus
} from './functions';
import logger from './logger';

export function addJaneWaitingAreaAudioTrack(value: Object) {
    return {
        type: ADD_JANE_WAITING_AREA_AUDIO_TRACK,
        value
    };
}

export function addJaneWaitingAreaVideoTrack(value: Object) {
    return {
        type: ADD_JANE_WAITING_AREA_VIDEO_TRACK,
        value
    };
}

export function addJaneWaitingAreaContentSharingTrack(value: Object) {
    return {
        type: ADD_JANE_WAITING_AREA_CONTENT_SHARING_TRACK,
        value
    };
}

export function initJaneWaitingArea(tracks: Object[], errors: Object) {
    return async function(dispatch: Function) {
        const audioTrack = tracks.find(t => t.isAudioTrack());
        const videoTrack = tracks.find(t => t.isVideoTrack());

        dispatch(setJaneWaitingAreaDeviceErrors(errors));

        if (audioTrack) {
            dispatch(addJaneWaitingAreaAudioTrack(audioTrack));
        } else {
            dispatch(setAudioDisabled());
        }

        if (videoTrack) {
            if (videoTrack.videoType === 'desktop') {
                dispatch(addJaneWaitingAreaContentSharingTrack(videoTrack));
                dispatch(setJaneWaitingAreaVideoDisabled(true));
            } else {
                dispatch(addJaneWaitingAreaVideoTrack(videoTrack));
            }
        } else {
            dispatch(setJaneWaitingAreaVideoDisabled(true));
        }
    };
}

export function joinConference() {
    return function(dispatch: Function) {
        dispatch(setJaneWaitingAreaPageVisibility(false));
        dispatch(startConference());
    };
}

export function replaceJaneWaitingAreaAudioTrack(track: Object) {
    return async (dispatch: Function, getState: Function) => {
        const oldTrack = getAudioTrack(getState());

        oldTrack && await oldTrack.dispose();
        dispatch(addJaneWaitingAreaAudioTrack(track));
    };
}

export function replaceAudioTrackById(deviceId: string) {
    return async (dispatch: Function) => {
        try {
            const track = await createLocalTrack('audio', deviceId);

            dispatch(replaceJaneWaitingAreaAudioTrack(track));
        } catch (err) {
            dispatch(setDeviceStatusWarning('janeWaitingArea.audioTrackError'));
            logger.log('Error replacing audio track', err);
        }
    };
}

export function replaceJaneWaitingAreaVideoTrack(track: Object) {
    return async (dispatch: Function, getState: Function) => {
        const oldTrack = getVideoTrack(getState());

        oldTrack && await oldTrack.dispose();
        dispatch(addJaneWaitingAreaVideoTrack(track));
    };
}

export function replaceVideoTrackById(deviceId: Object) {
    return async (dispatch: Function) => {
        try {
            const track = await createLocalTrack('video', deviceId);

            dispatch(replaceJaneWaitingAreaVideoTrack(track));
        } catch (err) {
            dispatch(setDeviceStatusWarning('janeWaitingArea.videoTrackError'));
            logger.log('Error replacing video track', err);
        }
    };
}

export function setJaneWaitingAreaAudioMuted(value: boolean) {
    return {
        type: SET_JANE_WAITING_AREA_AUDIO_MUTED,
        value
    };
}

export function setJaneWaitingAreaVideoDisabled(value: boolean) {
    return {
        type: SET_JANE_WAITING_AREA_VIDEO_DISABLED,
        value
    };
}

export function setJaneWaitingAreaVideoMuted(value: boolean) {
    return {
        type: SET_JANE_WAITING_AREA_VIDEO_MUTED,
        value
    };
}

export function setAudioDisabled() {
    return {
        type: SET_JANE_WAITING_AREA_AUDIO_DISABLED
    };
}

export function setDeviceStatusOk(deviceStatusText: string) {
    return {
        type: SET_DEVICE_STATUS,
        value: {
            deviceStatusText,
            deviceStatusType: 'ok'
        }
    };
}

export function setDeviceStatusWarning(deviceStatusText: string) {
    return {
        type: SET_DEVICE_STATUS,
        value: {
            deviceStatusText,
            deviceStatusType: 'warning'
        }
    };
}

export function setJaneWaitingAreaDeviceErrors(value: Object) {
    return {
        type: SET_JANE_WAITING_AREA_DEVICE_ERRORS,
        value
    };
}

export function setJaneWaitingAreaPageVisibility(value: boolean) {
    return {
        type: SET_JANE_WAITING_AREA_PAGE_VISIBILITY,
        value
    };
}

function startConference() {
    return {
        type: JANE_WAITING_AREA_START_CONFERENCE
    };
}

export function connectJaneSocketServer() {
    return {
        type: CONNECT_JANE_SOCKET_SERVER
    };
}

export function updateRemoteParticipantsStatuses(remoteParticipantsStatuses: Array<Object>) {
    return (dispatch: Function) => {
        if (hasRemoteParticipantInBeginStatus(remoteParticipantsStatuses)) {
            detectLegacyMobileApp(remoteParticipantsStatuses);
        } else {
            dispatch({
                type: UPDATE_REMOTE_PARTICIPANT_STATUSES,
                value: remoteParticipantsStatuses
            });
        }
    };
}

export function updateRemoteParticipantsStatusesFromSocket(event: Object) {
    return (dispatch: Function, getState: Function) => {
        const { remoteParticipantsStatuses } = getState()['features/jane-waiting-area'];

        if (remoteParticipantsStatuses.some(v => v.participant_id === event.participant_id)) {
            remoteParticipantsStatuses.forEach(v => {
                if (v.participant_id === event.participant_id) {
                    v.info = event.info;
                    v.updated_at = event.updated_at;
                }
            });
        } else {
            remoteParticipantsStatuses.push(event);
        }
        dispatch(updateRemoteParticipantsStatuses(remoteParticipantsStatuses));
    };
}

export function setJaneWaitingAreaAuthState(value: string) {
    return {
        type: SET_JANE_WAITING_AREA_AUTH_STATE,
        value
    };
}
