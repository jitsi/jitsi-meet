// @flow

import type { Dispatch } from 'redux';

import {
    AlertDialog,
    openDialog
} from '../base/dialog';
import { getParticipantDisplayName } from '../base/participants';

/**
 * Notify that we've been kicked out of the conference.
 *
 * @param {JitsiParticipant} participant - The {@link JitsiParticipant}
 * instance which initiated the kick event.
 * @param {?Function} submit - The function to execute after submiting the dialog.
 * @returns {Function}
 */
export function notifyKickedOut(participant: Object, submit: ?Function) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        if (!participant || (participant.isReplaced && participant.isReplaced())) {
            submit && submit();

            return;
        }

        dispatch(openDialog(AlertDialog, {
            contentKey: {
                key: 'dialog.kickTitle',
                params: {
                    participantDisplayName: getParticipantDisplayName(getState, participant.getId())
                }
            },
            onSubmit: submit
        }));
    };
}
