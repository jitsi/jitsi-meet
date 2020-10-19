// @flow

import jwtDecode from 'jwt-decode';
import { RemoteParticipantStatus } from './RemoteParticipantStatus';
import { doGetJSON, sendBeaconToJaneRN } from '../base/util';

export function isJaneWaitingAreaPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnableJaneWaitingAreaPage = jwtPayload && jwtPayload.context && jwtPayload.context.waiting_area_enabled || false;

    return state['features/base/config'].janeWaitingAreaPageEnabled || shouldEnableJaneWaitingAreaPage;
}

export function isJaneWaitingAreaPageVisible(state: Object): boolean {
    return isJaneWaitingAreaPageEnabled(state) && state['features/jane-waiting-area-native']?.showJaneWaitingArea;
}

export async function checkRoomStatus(jwt) {
    try {
        const jwtPayload = jwt && jwtDecode(jwt) || null;
        const roomStatusUrl = jwtPayload && jwtPayload.context && jwtPayload.context.room_status_url || '';
        const url = new URL(roomStatusUrl);
        const params = { jwt };
        url.search = new URLSearchParams(params).toString();

        return doGetJSON(url, true);
    } catch (e) {
        console.error(e);
    }
}

export async function getRemoteParticipantsReadyStatus(participantsStatus, participantType) {
    const remoteParticipantType = participantType === 'StaffMember' ? 'Patient' : 'StaffMember';
    let remoteParticipantStatus = [];
    participantsStatus && participantsStatus.forEach((v) => {
        if (v.participant_type === remoteParticipantType) {
            remoteParticipantStatus.push(new RemoteParticipantStatus(v));
        }
    });
    return remoteParticipantStatus;
}

export function updateParticipantReadyStatus(jwt, participantType, participant, status) {
    try {
        const jwtPayload = jwt && jwtDecode(jwt) || null;
        const updateParticipantStatusUrl = jwtPayload && jwtPayload.context && jwtPayload.context.update_participant_status_url || '';
        const info = { status };
        const obj = {
            jwt,
            info,
            participant_type: participantType === 'StaffMember' ? 'staff_member' : 'patient',
            participant_id: participant.participant_id,
            participant_name: participant.name,
            room_name: jwtPayload.room
        };
        const data = new Blob([ JSON.stringify(obj, null, 2) ], { type: 'text/plain; charset=UTF-8' });
        const errorMsg = 'Can Not Update Current Participant\'s Status.';
        sendBeaconToJaneRN(updateParticipantStatusUrl, data, errorMsg);
    } catch (e) {
        console.error(e);
    }
}

export function getLocalParticipantFromJwt(state) {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;

    return jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
}

export function getLocalParticipantType(state) {
    const participant = getLocalParticipantFromJwt(state);

    return participant && participant.participant_type || null;
}

export function checkLocalParticipantCanJoin(participant_statuses, participantType) {
    const remoteParticipantsStatus = participant_statuses && getRemoteParticipantsReadyStatus(participant_statuses, participantType);

    return remoteParticipantsStatus && remoteParticipantsStatus.info && remoteParticipantsStatus.info.status !== 'left' || false;
}
