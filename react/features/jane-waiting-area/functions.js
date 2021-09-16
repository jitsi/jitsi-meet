// @flow
/* eslint-disable require-jsdoc,max-len, no-undef*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';

import {
    createWaitingAreaParticipantStatusChangedEvent,
    sendAnalytics
} from '../analytics';
import {
    getLocalParticipantType
} from '../base/participants/functions';
import { doGetJSON } from '../base/util';
import { showErrorNotification } from '../notifications';

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
    const jwtPayload = jwt && jwtDecode(jwt) ?? {};
    const shouldEnableJaneWaitingAreaPage = _.get(jwtPayload, 'context.waiting_area_enabled');

    return state['features/base/config'].janeWaitingAreaPageEnabled || shouldEnableJaneWaitingAreaPage;
}

export function isJaneWaitingAreaPageVisible(state: Object): boolean {
    return isJaneWaitingAreaPageEnabled(state) && state['features/jane-waiting-area']?.showJaneWaitingArea;
}

export async function checkRoomStatus(): Promise<Object> {
    try {
        const { jwt } = window.APP.store.getState()['features/base/jwt'];
        const jwtPayload = jwt && jwtDecode(jwt) ?? {};
        const roomStatusUrl = _.get(jwtPayload, 'context.room_status_url') ?? '';

        const url = new URL(roomStatusUrl);
        const params = { jwt };

        url.search = new URLSearchParams(params).toString();

        return doGetJSON(url, true);
    } catch (e) {
        throw Error(e);
    }
}

export function getRemoteParticipantsStatuses(participantStatuses: Array<Object>, participantType: string): Array<Object> {
    const remoteParticipantType = participantType === 'StaffMember' ? 'Patient' : 'StaffMember';
    const remoteParticipantStatuses = [];

    participantStatuses && participantStatuses.forEach(v => {
        if (v.participant_type === remoteParticipantType) {
            remoteParticipantStatuses.push(v);
        }
    });

    return remoteParticipantStatuses;
}

export function updateParticipantReadyStatus(status: string): void {
    const { jwt } = window.APP.store.getState()['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) ?? {};

    const updateParticipantStatusUrl = _.get(jwtPayload, 'context.update_participant_status_url') ?? '';
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
    })
    .then(res => {
        if (!res.ok) {
            throw new Error('Failed to update the waiting area state for the local participant.');
        }

        // The 'left' amplitude event will be fired outside of this function
        // because if the user quits the call by closing the browser window directly,
        // we won't able to get the response from the promise in time here.
        if (status !== 'left') {
            sendAnalytics(createWaitingAreaParticipantStatusChangedEvent(status));
        }
    })
    .catch(error => {
        sendAnalytics(createWaitingAreaParticipantStatusChangedEvent('failed'));
        window.APP.store.dispatch(showErrorNotification({
            descriptionKey: error,
            titleKey: 'Waiting area error'
        }));
        console.error(error);
    });
}

export function isRNSocketWebView(locationURL: Object): boolean {
    return String(locationURL && locationURL.href ?? '').includes('RNsocket=true');
}

export function checkLocalParticipantCanJoin(state: Object | Function): boolean {
    const { remoteParticipantsStatuses } = state['features/jane-waiting-area'];
    const participantType = getLocalParticipantType(state);

    return remoteParticipantsStatuses && remoteParticipantsStatuses.length > 0 && remoteParticipantsStatuses.some(v => {
        if (participantType === 'StaffMember') {
            return v.info && (v.info.status === 'joined' || v.info.status === 'waiting');
        }

        return v.info && v.info.status === 'joined';
    }) ?? false;
}

export function detectLegacyMobileApp(remoteParticipantsStatuses: Array<Object>) {
    const now = Math.floor(Date.now() / 1000);
    // eslint-disable-next-line no-undef
    const participantType = getLocalParticipantType(window.APP.store.getState());
    let checkRoomStatusAgain = false;

    remoteParticipantsStatuses.forEach(status => {
        if (status.info.status === 'begin') {
            if (now - status.updated_at > 4) {
                if (participantType === 'StaffMember') {
                    status.info.status = 'waiting';
                } else {
                    status.info.status = 'joined';
                    sendAnalytics(createWaitingAreaParticipantStatusChangedEvent('joined'));
                }
            } else {
                checkRoomStatusAgain = true;
            }
        }
    });

    if (checkRoomStatusAgain) {
        setTimeout(async () => {
            try {
                const response = await checkRoomStatus();
                const newRemoteParticipantsStatuses = getRemoteParticipantsStatuses(response.participant_statuses, participantType);

                window.APP.store.dispatch(updateRemoteParticipantsStatuses(newRemoteParticipantsStatuses));
            } catch (e) {
                console.error(e);
            }
        }, 5000);
    } else {
        window.APP.store.dispatch({
            type: UPDATE_REMOTE_PARTICIPANT_STATUSES,
            value: remoteParticipantsStatuses
        });
    }
}

export function hasRemoteParticipantInBeginStatus(remoteParticipantsStatuses: Array<Object>) {
    return remoteParticipantsStatuses.some(v => v.info && v.info.status === 'begin');
}

export function sendMessageToIosApp(message: Object) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
}
