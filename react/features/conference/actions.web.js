// @flow

import type { Dispatch } from 'redux';

import { getParticipantDisplayName } from '../base/participants';
import {
    NOTIFICATION_TYPE,
    showNotification
} from '../notifications';

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
        if (!participant || (participant.isReplaced && participant.isReplaced())) {
            return;
        }

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
