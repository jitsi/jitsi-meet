// @flow
/* eslint-disable require-jsdoc*/

import jwtDecode from 'jwt-decode';

export function isJaneWaitingAreaPageEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const shouldEnableJaneWaitingAreaPage = jwtPayload
        && jwtPayload.context && jwtPayload.context.waiting_area_enabled || false;

    return state['features/base/config'].janeWaitingAreaPageEnabled || shouldEnableJaneWaitingAreaPage;
}

export function isJaneWaitingAreaPageVisible(state: Object): boolean {
    return isJaneWaitingAreaPageEnabled(state) && state['features/jane-waiting-area-native']?.showJaneWaitingArea;
}

export function updateParticipantReadyStatus(jwt: string, status: string): Promise {
    try {
        const jwtPayload = jwt && jwtDecode(jwt) || null;
        const updateParticipantStatusUrl = jwtPayload
            && jwtPayload.context && jwtPayload.context.update_participant_status_url || '';
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
                    throw Error('Can Not Update Current Participant\'s Status.');
                }
            });
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

export function checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType) {
    return remoteParticipantsStatuses && remoteParticipantsStatuses.length > 0 && remoteParticipantsStatuses.some(v => {
        if (participantType === 'StaffMember') {
            return v.info && (v.info.status === 'joined' || v.info.status === 'waiting');
        }

        return v.info && v.info.status === 'joined';

    }) || false;
}
