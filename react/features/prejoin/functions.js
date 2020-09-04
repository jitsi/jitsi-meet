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
    return isPrejoinPageEnabled(state) && state['features/prejoin']?.showPrejoin;
}

export async function checkOtherParticipantsReady(jwt, jwtPayload) {
    const url = new URL(jwtPayload.context.check_ready_status_url);

    const params = { jwt: jwt };
    url.search = new URLSearchParams(params).toString();

    return fetch(url)
        .then(response => response.json())
        .then(res => res.other_participants_ready);
}

export async function localParticipantIsReady(jwt, jwtPayload, participantType, participant) {
    if (jwt && jwtPayload) {
        const participantReadyUrl = jwtPayload.context.participant_ready_url;
        const obj = {
            jwt,
            // eslint-disable-next-line camelcase
            info: participantType === 'StaffMember' ? 'practitioner_ready' : 'patient_ready',
            participant_type: participantType === 'StaffMember' ? 'staff_member' : 'patient',
            participant_id: participant.participant_id,
            participant_name: participant.name,
            room_name: jwtPayload.room
        };
        const data = new Blob([ JSON.stringify(obj, null, 2) ], { type: 'text/plain; charset=UTF-8' });
        // eslint-disable-next-line no-mixed-operators
        sendBeaconRn(participantReadyUrl, data);
    }
}
