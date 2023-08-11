import { IStore } from '../app/types';
import { configureInitialDevices } from '../base/devices/actions.web';
import { openDialog } from '../base/dialog/actions';
import { getParticipantDisplayName } from '../base/participants/functions';
import { getBackendSafeRoomName } from '../base/util/uri';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../notifications/constants';

import { DISMISS_CALENDAR_NOTIFICATION } from './actionTypes';
import LeaveReasonDialog from './components/web/LeaveReasonDialog.web';
import logger from './logger';

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


/**
 * Opens {@code LeaveReasonDialog}.
 *
 * @param {string} [titleKey] - The translation key of the dialog title.
 * @param {Function} [onClose] - An optional callback to invoke when the dialog
 * is closed.
 *
 * @returns {Promise} Resolved when the dialog is closed.
 */
export function openLeaveReasonDialog(titleKey?: string) {
    return (dispatch: IStore['dispatch']): Promise<void> => new Promise(resolve => {
        dispatch(openDialog(LeaveReasonDialog, {
            onClose: resolve,
            titleKey
        }));
    });
}

/**
 * Dismisses calendar notification about next or ongoing event.
 *
 * @returns {Object}
 */
export function dismissCalendarNotification() {
    return {
        type: DISMISS_CALENDAR_NOTIFICATION
    };
}

/**
 * Init.
 *
 * @returns {Promise<JitsiConnection>}
 */
export function init() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const room = getBackendSafeRoomName(getState()['features/base/conference'].room);

        // XXX For web based version we use conference initialization logic
        // from the old app (at the moment of writing).
        return dispatch(configureInitialDevices()).then(
            () => APP.conference.init({
                roomName: room
            }).catch((error: Error) => {
                APP.API.notifyConferenceLeft(APP.conference.roomName);
                logger.error(error);
            }));
    };
}
