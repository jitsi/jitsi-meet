import { IStore } from '../app/types';
import { configureInitialDevices, getAvailableDevices } from '../base/devices/actions.web';
import { openDialog } from '../base/dialog/actions';
import { getBackendSafeRoomName } from '../base/util/uri';

import { DISMISS_CALENDAR_NOTIFICATION } from './actionTypes';
import LeaveReasonDialog from './components/web/LeaveReasonDialog.web';
import logger from './logger';

/**
 * Opens {@code LeaveReasonDialog}.
 *
 * @param {string} [title] - The dialog title.
 *
 * @returns {Promise} Resolved when the dialog is closed.
 */
export function openLeaveReasonDialog(title?: string) {
    return (dispatch: IStore['dispatch']): Promise<void> => new Promise(resolve => {
        dispatch(openDialog(LeaveReasonDialog, {
            onClose: resolve,
            title
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
 * Setups initial devices. Makes sure we populate availableDevices list before configuring.
 *
 * @returns {Promise<any>}
 */
export function setupInitialDevices() {
    return async (dispatch: IStore['dispatch']) => {
        await dispatch(getAvailableDevices());
        await dispatch(configureInitialDevices());
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
        return dispatch(setupInitialDevices()).then(
            () => APP.conference.init({
                roomName: room
            }).catch((error: Error) => {
                APP.API.notifyConferenceLeft(APP.conference.roomName);
                logger.error(error);
            }));
    };
}
