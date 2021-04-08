// @flow
/* eslint-disable require-jsdoc,max-len, no-undef*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import {
    createWaitingAreaPageEvent,
    sendAnalytics
} from '../analytics';

export function isJaneWaitingAreaEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) ?? null;
    const janeWaitingAreaEnabled = _.get(jwtPayload, 'context.waiting_area_enabled') ?? false;

    return state['features/base/config'].janeWaitingAreaEnabled || janeWaitingAreaEnabled;
}

export function updateParticipantReadyStatus(jwt: string, status: string): void {
    try {
        const jwtPayload = jwt && jwtDecode(jwt) ?? {};
        const updateParticipantStatusUrl = _.get(jwtPayload, 'context.update_participant_status_url') ?? '';
        const info = { status };

        sendAnalytics(createWaitingAreaPageEvent(
            'participant.status.changed',
           { status }
        ));

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
                throw Error('Can not update current participant\'s status.');
            }
        });
    } catch (error) {
        sendAnalytics(createWaitingAreaPageEvent('error', { error }));
        console.error(error);
    }
}

export function checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType) {
    return remoteParticipantsStatuses && remoteParticipantsStatuses.length > 0 && remoteParticipantsStatuses.some(v => {
        if (participantType === 'StaffMember') {
            return v.info && (v.info.status === 'joined' || v.info.status === 'waiting');
        }

        return v.info && v.info.status === 'joined';

    }) ?? false;
}
