// @flow
/* eslint-disable require-jsdoc,max-len, no-undef*/
import jwtDecode from 'jwt-decode';
import _ from 'lodash';

import { showErrorNotification } from '../notifications';

export function isJaneWaitingAreaEnabled(state: Object): boolean {
    const { jwt } = state['features/base/jwt'];
    const jwtPayload = jwt && jwtDecode(jwt) ?? null;
    const janeWaitingAreaEnabled = _.get(jwtPayload, 'context.waiting_area_enabled') ?? false;

    return state['features/base/config'].janeWaitingAreaEnabled || janeWaitingAreaEnabled;
}


export function updateParticipantReadyStatus(jwt: string, status: string): void {
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
        })
        .catch(error => {
            if (navigator.product !== 'ReactNative') {
                window.APP.store.dispatch(showErrorNotification({
                    descriptionKey: error,
                    titleKey: 'Waiting area error'
                }));
            }
            console.error(error);
        });
}

export function checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType) {
    return remoteParticipantsStatuses && remoteParticipantsStatuses.length > 0 && remoteParticipantsStatuses.some(v => {
        if (participantType === 'StaffMember') {
            return v.info && (v.info.status === 'joined' || v.info.status === 'waiting');
        }

        return v.info && v.info.status === 'joined';

    }) ?? false;
}
