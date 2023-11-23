// @flow
/* eslint-disable require-jsdoc,camelcase*/
import jwtDecode from 'jwt-decode';

import { overwriteLocalParticipant, user2participant } from '../base/jwt/middleware';
import { createLocalTrack } from '../base/lib-jitsi-meet';
import { isVideoMutedByUser } from '../base/media';
import { getLocalParticipant } from '../base/participants';
import {
    createLocalTracksF,
    getLocalAudioTrack,
    getLocalVideoTrack,
    replaceLocalTrack,
    trackAdded
} from '../base/tracks';

import {
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
    ADD_CONNECTION_TO_JANE_WAITING_AREA,
    ENABLE_JANE_WAITING_AREA_PAGE,
    SET_JANE_WAITING_AREA_AUTH_STATE,
    SET_JANE_APPOINTMENT_DETAILS
} from './actionTypes';
import { findLocalParticipantFromjitsiDetailsParticipants,
    detectLegacyMobileApp,
    hasRemoteParticipantInBeginStatus
} from './functions';
import logger from './logger';


export function addConnectionToJaneWaitingArea(connection: Object) {
    return {
        type: ADD_CONNECTION_TO_JANE_WAITING_AREA,
        connection
    };
}

export function initJaneWaitingArea(tracks: Object[], connection: Object[], errors: Object) {
    return async function(dispatch: Function) {
        dispatch(setJaneWaitingAreaDeviceErrors(errors));
        tracks.forEach(track => dispatch(trackAdded(track)));
        setTimeout(() => {
            dispatch(addConnectionToJaneWaitingArea(connection));
        });
    };
}

export function joinConference() {
    return function(dispatch: Function) {
        dispatch(setJaneWaitingAreaPageVisibility(false));
        dispatch(startConference());
    };
}

export function replaceAudioTrackById(deviceId: string) {
    return async (dispatch: Function, getState: Function) => {
        try {
            const tracks = getState()['features/base/tracks'];
            const newTrack = await createLocalTrack('audio', deviceId);
            const oldTrack = getLocalAudioTrack(tracks)?.jitsiTrack;

            dispatch(replaceLocalTrack(oldTrack, newTrack));
        } catch (err) {
            dispatch(setDeviceStatusWarning('janeWaitingArea.audioTrackError'));
            logger.log('Error replacing audio track', err);
        }
    };
}

export function replaceVideoTrackById(deviceId: Object) {
    return async (dispatch: Function, getState: Function) => {
        try {
            const tracks = getState()['features/base/tracks'];
            const wasVideoMuted = isVideoMutedByUser(getState());
            const [ newTrack ] = await createLocalTracksF(
                { cameraDeviceId: deviceId,
                    devices: [ 'video' ] },
                { dispatch,
                    getState }
            );
            const oldTrack = getLocalVideoTrack(tracks)?.jitsiTrack;

            dispatch(replaceLocalTrack(oldTrack, newTrack));
            wasVideoMuted && newTrack.mute();
        } catch (err) {
            dispatch(setDeviceStatusWarning('prejoin.videoTrackError'));
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

// eslint-disable-next-line no-shadow,require-jsdoc
export function enableJaneWaitingArea(janeWaitingAreaEnabled: ?boolean) {
    return {
        type: ENABLE_JANE_WAITING_AREA_PAGE,
        janeWaitingAreaEnabled
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

export function setJaneAppointmentDetails(jitsiDetails: Object) {
    const appointmentDetails = {
        start_at: jitsiDetails.start_at,
        end_at: jitsiDetails.end_at,
        practitioner_name: jitsiDetails.practitioner_name,
        treatment: jitsiDetails.treatment,
        treatment_duration: jitsiDetails.treatment_duration
    };

    return {
        type: SET_JANE_APPOINTMENT_DETAILS,
        value: appointmentDetails
    };
}

export function overwriteLocalParticipantWithJitsiDetails(jitsiDetails: Object) {
    return (dispatch: Function, getState: Function) => {
        const store = getState();

        if (!store) {
            return;
        }

        const { jwt } = store['features/base/jwt'];

        // Early return if JWT, jitsiDetails are missing
        if (!jwt || !jitsiDetails) {
            return;
        }

        const jwtPayload = jwtDecode(jwt);
        const localUserInfoFromJwt = jwtPayload?.context?.user;
        const participants = jitsiDetails.participants;
        const localUserInfoFromJitsiDetails
            = findLocalParticipantFromjitsiDetailsParticipants(participants, localUserInfoFromJwt);
        const localUserInfoFromStore = getLocalParticipant(store);

        if (localUserInfoFromJitsiDetails) {
            localUserInfoFromJitsiDetails.id = localUserInfoFromJwt.id;
            const user = user2participant(localUserInfoFromJitsiDetails);
            const localUserNameFromStore = localUserInfoFromStore?.name;

            if (user && localUserNameFromStore !== user?.name) {
                overwriteLocalParticipant({ dispatch,
                    getState }, { ...user });
            }
        }
    };
}
