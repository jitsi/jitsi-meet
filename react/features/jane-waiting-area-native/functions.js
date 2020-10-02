// @flow

import jwtDecode from 'jwt-decode';
import { sendBeaconRn } from '../base/conference';
import { RemoteParticipantStatus } from './RemoteParticipantStatus';

export function isJaneWaitingAreaPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnableJaneWaitingAreaPage = jwtPayload && jwtPayload.context && jwtPayload.context.ws_host && jwtPayload.context.ws_token;

    return state['features/base/config'].janeWaitingAreaPageEnabled || shouldEnableJaneWaitingAreaPage;
}

export function isJaneWaitingAreaPageVisible(state: Object): boolean {
    return isJaneWaitingAreaPageEnabled(state) && state['features/jane-waiting-area-native']?.showJaneWaitingArea;
}

export async function getAllParticipantsStatus(jwt, jwtPayload) {
    const url = new URL(jwtPayload.context.check_participants_status_url);

    const params = { jwt };

    url.search = new URLSearchParams(params).toString();

    return fetch(url).then(response => response.json())
        .then(res => res.participants_status);
}

export async function getRemoteParticipantsReadyStatus(jwt, jwtPayload, participantType) {
    const allParticipantsStatus = await getAllParticipantsStatus(jwt, jwtPayload);
    const remoteParticipantType = participantType === 'StaffMember' ? 'Patient' : 'StaffMember';
    const remoteParticipantStatus = [];

    allParticipantsStatus && allParticipantsStatus.forEach(v => {
        if (v.participant_type === remoteParticipantType) {
            remoteParticipantStatus.push(new RemoteParticipantStatus(v));
        }
    });

    return remoteParticipantStatus;
}

export function updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, status) {
    if (jwt && jwtPayload) {
        const updateParticipantStatusUrl = jwtPayload.context.update_participant_status_url;
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

        sendBeaconRn(updateParticipantStatusUrl, data);
    }
}
