/* eslint-disable */
import jwtDecode from 'jwt-decode';
import { doGetJSON } from '../base/util';
import { UPDATE_REMOTE_PARTICIPANT_STATUSES } from './actionTypes';
import { updateRemoteParticipantsStatuses } from './actions';

function applyMuteOptionsToTrack(track, shouldMute) {
    if (track.isMuted() === shouldMute) {
        return;
    }

    if (shouldMute) {
        return track.mute();
    }

    return track.unmute();
}

export function isDeviceStatusVisible(state: Object): boolean {
    return !((isAudioDisabled(state) && isJaneWaitingAreaVideoDisabled(state))
        || (isJaneWaitingAreaAudioMuted(state) && isJaneWaitingAreaVideoMuted(state)));
}

export function getActiveVideoTrack(state: Object): Object {
    const track = getVideoTrack(state) || getContentSharingTrack(state);

    if (track && track.isActive()) {
        return track;
    }

    return null;
}

export async function getAllJaneWaitingAreaConfiguredTracks(state: Object): Promise<Object[]> {
    const tracks = [];
    const audioTrack = getAudioTrack(state);
    const videoTrack = getVideoTrack(state);
    const csTrack = getContentSharingTrack(state);

    if (csTrack) {
        tracks.push(csTrack);
    } else if (videoTrack) {
        await applyMuteOptionsToTrack(videoTrack, isJaneWaitingAreaVideoMuted(state));
        tracks.push(videoTrack);
    }

    if (audioTrack) {
        await applyMuteOptionsToTrack(audioTrack, isJaneWaitingAreaAudioMuted(state));
        isJaneWaitingAreaAudioMuted(state) && audioTrack.mute();
        tracks.push(audioTrack);
    }

    return tracks;
}

export function getAudioTrack(state: Object): Object {
    return state['features/jane-waiting-area']?.audioTrack;
}

export function getContentSharingTrack(state: Object): Object {
    return state['features/jane-waiting-area']?.contentSharingTrack;
}

export function getDeviceStatusText(state: Object): string {
    return state['features/jane-waiting-area']?.deviceStatusText;
}

export function getDeviceStatusType(state: Object): string {
    return state['features/jane-waiting-area']?.deviceStatusType;
}

export function getVideoTrack(state: Object): Object {
    return state['features/jane-waiting-area']?.videoTrack;
}

export function isJaneWaitingAreaAudioMuted(state: Object): boolean {
    return state['features/jane-waiting-area']?.audioMuted;
}

export function isJaneWaitingAreaVideoMuted(state: Object): boolean {
    return state['features/jane-waiting-area']?.videoMuted;
}

export function getRawError(state: Object): string {
    return state['features/jane-waiting-area']?.rawError;
}

export function isAudioDisabled(state: Object): Object {
    return state['features/jane-waiting-area']?.audioDisabled;
}

export function isJaneWaitingAreaVideoDisabled(state: Object): Object {
    return state['features/jane-waiting-area']?.videoDisabled;
}

export function getJaneWaitingAreaPageDisplayName(state: Object): string {
    return state['features/base/participants'][0].name || '';
}

export function isJaneWaitingAreaPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnableJaneWaitingAreaPage = jwtPayload && jwtPayload.context && jwtPayload.context.waiting_area_enabled;

    return state['features/base/config'].janeWaitingAreaPageEnabled || shouldEnableJaneWaitingAreaPage;
}

export function isJaneWaitingAreaPageVisible(state: Object): boolean {
    return isJaneWaitingAreaPageEnabled(state) && state['features/jane-waiting-area']?.showJaneWaitingArea;
}

export async function checkRoomStatus(): Object {
    try {
        const { jwt } = APP.store.getState()['features/base/jwt'];
        const jwtPayload = jwt && jwtDecode(jwt) || null;
        const roomStatusUrl = jwtPayload && jwtPayload.context && jwtPayload.context.room_status_url || '';
        const url = new URL(roomStatusUrl);
        const params = { jwt };
        url.search = new URLSearchParams(params).toString();

        return doGetJSON(url, true);
    } catch (e) {
        throw Error(e);
    }
}

export function getRemoteParticipantsStatues(participantStatuses: Array, participantType: string): Array {
    const remoteParticipantType = participantType === 'StaffMember' ? 'Patient' : 'StaffMember';
    let remoteParticipantStatuses = [];
    participantStatuses && participantStatuses.forEach((v) => {
        if (v.participant_type === remoteParticipantType) {
            remoteParticipantStatuses.push(v);
        }
    });
    return remoteParticipantStatuses;
}

export function updateParticipantReadyStatus(status: string): Promise {
    try {
        const { jwt } = APP.store.getState()['features/base/jwt'];
        const jwtPayload = jwt && jwtDecode(jwt) || null;
        const updateParticipantStatusUrl = jwtPayload && jwtPayload.context && jwtPayload.context.update_participant_status_url || '';
        const info = { status };
        return fetch(updateParticipantStatusUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'jwt': jwt,
                'info': info
            })
        }).then(res => {
            if (!res.ok) {
                throw Error('Can Not Update Current Participant\'s Status.');
            }
        });
    } catch (e) {
        console.error(e);
    }
}

export function isRNSocketWebView(locationURL: string): boolean {
    return String(locationURL && locationURL.href || '').includes('RNsocket=true');
}

export function checkLocalParticipantCanJoin(remoteParticipantsStatuses: Array, participantType: string): boolean {
    return remoteParticipantsStatuses && remoteParticipantsStatuses.length > 0 && remoteParticipantsStatuses.some(v => {
        if (participantType === 'StaffMember') {
            return v.info && (v.info.status === 'joined' || v.info.status === 'waiting');
        }
        return v.info && v.info.status === 'joined';
    }) || false;
}

export function getLocalParticipantFromJwt(state: Object): Object {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;

    return jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
}

export function getLocalParticipantType(state: Object): string {
    const participant = getLocalParticipantFromJwt(state);

    return participant && participant.participant_type;
}

export function detectLegacyMobileApp(remoteParticipantsStatuses) {
    const now = Math.floor(Date.now() / 1000);
    const participantType = getLocalParticipantType(APP.store.getState());
    let fetchRoomStatusAgain = false;
    remoteParticipantsStatuses.forEach(status => {
        if (status.info.status === 'begin') {
            if (now - status.updated_at > 4) {
                if (participantType === 'StaffMember') {
                    status.info.status = 'waiting';
                } else {
                    status.info.status = 'joined';
                }
            } else {
                fetchRoomStatusAgain = true;
            }
        }
    });

    if (fetchRoomStatusAgain) {
        const { jwt } = APP.store.getState()['features/base/jwt'];
        setTimeout(async () => {
            try {
                const response = await checkRoomStatus(jwt);
                const remoteParticipantsStatuses = getRemoteParticipantsStatues(response.participant_statuses, participantType);
                APP.store.dispatch(updateRemoteParticipantsStatuses(remoteParticipantsStatuses));
            } catch (e) {
                console.error(e);
            }
        }, 5000);
    } else {
        APP.store.dispatch({
            type: UPDATE_REMOTE_PARTICIPANT_STATUSES,
            value: remoteParticipantsStatuses
        });
    }
}

export function hasRemoteParticipantInBeginStatus(remoteParticipantsStatuses) {
    return remoteParticipantsStatuses.some(v => v.info && v.info.status === 'begin');
}
