// @flow

import type { Dispatch } from 'redux';

import {
    NOTIFICATION_TYPE,
    showNotification
} from '../notifications';
import { getParticipantDisplayName } from '../base/participants';

/**
 * Notify that we've been kicked out of the conference.
 *
 * @param {JitsiParticipant} participant - The {@link JitsiParticipant}
 * instance which initiated the kick event.
 * @param {?Function} _ - Used only in native code.
 * @returns {Function}
 */
export function notifyKickedOut(participant: Object, _: ?Function) { // eslint-disable-line no-unused-vars
    return (dispatch: Dispatch<any>, getState: Function) => {
        const args = {
            participantDisplayName:
                getParticipantDisplayName(getState, participant.getId())
        };

        dispatch(showNotification({
            appearance: NOTIFICATION_TYPE.ERROR,
            hideErrorSupportLink: true,
            descriptionKey: 'dialog.kickMessage',
            descriptionArguments: args,
            titleKey: 'dialog.kickTitle',
            titleArguments: args
        }));
    };
}
