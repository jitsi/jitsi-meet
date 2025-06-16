import { IStore } from '../app/types';
import { configureInitialDevices, getAvailableDevices } from '../base/devices/actions.web';
import { openDialog } from '../base/dialog/actions';
import { getJitsiMeetGlobalNSConnectionTimes } from '../base/util/helpers';
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
 * @param {boolean} recordTimeMetrics - If true, an analytics time metrics will be sent.
 * @returns {Promise<any>}
 */
export function setupInitialDevices(recordTimeMetrics = false) {
    return async (dispatch: IStore['dispatch']) => {
        if (recordTimeMetrics) {
            getJitsiMeetGlobalNSConnectionTimes()['setupInitialDevices.start'] = window.performance.now();
        }

        await dispatch(getAvailableDevices());

        if (recordTimeMetrics) {
            getJitsiMeetGlobalNSConnectionTimes()['setupInitialDevices.getAD.finished'] = window.performance.now();
        }

        await dispatch(configureInitialDevices());

        const now = window.performance.now();

        if (recordTimeMetrics) {
            getJitsiMeetGlobalNSConnectionTimes()['setupInitialDevices.end'] = now;
        }
        logger.debug(`(TIME) setupInitialDevices finished: ${now}`);
    };
}

/**
 * Init.
 *
 * @param {boolean} shouldDispatchConnect - Whether or not connect should be dispatched. This should be false only when
 * prejoin is enabled.
 * @returns {Promise<JitsiConnection>}
 */
export function init(shouldDispatchConnect: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        logger.debug(`(TIME) init action dispatched: ${window.performance.now()}`);

        const room = getBackendSafeRoomName(getState()['features/base/conference'].room);

        // XXX For web based version we use conference initialization logic
        // from the old app (at the moment of writing).
        return dispatch(setupInitialDevices(true)).then(
            () => APP.conference.init({
                roomName: room,
                shouldDispatchConnect
            }).catch((error: Error) => {
                APP.API.notifyConferenceLeft(APP.conference.roomName);
                logger.error(error);
            }));
    };
}
