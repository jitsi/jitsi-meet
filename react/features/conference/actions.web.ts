import { IStore } from '../app/types';
import { getParticipantDisplayName } from '../base/participants/functions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';

/**
 * Notify that we've been kicked out of the conference.
 *
 * @param {JitsiParticipant} participant - The {@link JitsiParticipant}
 * instance which initiated the kick event.
 * @param {?Function} _ - Used only in native code.
 * @returns {Function}
 */
export function notifyKickedOut(participant: any, _?: Function) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!participant || participant?.isReplaced()) {
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
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
    };
}
