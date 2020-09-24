// @flow

import jwtDecode from 'jwt-decode';
import { sendBeaconRn } from '../base/conference';

export function isPrejoinPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnablePreJoinPage = jwtPayload && jwtPayload.context && jwtPayload.context.ws_host && jwtPayload.context.ws_token;

    return state['features/base/config'].prejoinPageEnabled || shouldEnablePreJoinPage;
}

export function isPrejoinPageVisible(state: Object): boolean {
    return isPrejoinPageEnabled(state) && state['features/jane-waiting-area-native']?.showPrejoin;
}

export async function getParticipantsStatus(jwt, jwtPayload) {
    const url = new URL(jwtPayload.context.check_participants_status_url);

    const params = { jwt };

    url.search = new URLSearchParams(params).toString();

    return fetch(url).then(response => response.json())
        .then(res => res.participants_status);
}

export async function checkOtherParticipantsReadyStatus(jwt, jwtPayload, participantType) {
    const otherParticipantsStatus = await getParticipantsStatus(jwt, jwtPayload);
    const otherParticipantType = participantType === 'StaffMember' ? 'Patient' : 'StaffMember';
    return otherParticipantsStatus && otherParticipantsStatus.find((v) => {
        return v.participant_type === otherParticipantType;
    });
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
        const data = new Blob([JSON.stringify(obj, null, 2)], { type: 'text/plain; charset=UTF-8' });
        sendBeaconRn(updateParticipantStatusUrl, data);
    }
}
