import { IStore } from '../../../../../app/types';
import {
    showConnectionLostNotification,
    showConnectionRestoredNotification,
    showDeviceSuspendedNotification,
} from './notification-helpers';
import { ConnectionState } from "./types";

/**
 * Handles when ICE connection is interrupted (packet loss, network issue)
 * User can still see frozen video but quality degrades
 *
 * @param dispatch - Redux dispatch function
 * @param state - Connection state to mark that interruption occurred
 */
export const handleMediaConnectionInterrupted = (dispatch: IStore["dispatch"], state: ConnectionState) => {
    console.log("[CONNECTION_NOTIFICATIONS] Media connection interrupted (ICE)");
    state.wasMediaConnectionInterrupted = true;
    showConnectionLostNotification(dispatch);
};

/**
 * Handles when ICE connection is restored after interruption
 * Video/audio quality returns to normal
 * Only shows notification if there was a previous interruption (not on initial join)
 *
 * @param dispatch - Redux dispatch function
 * @param state - Connection state to check if there was a previous interruption
 */
export const handleMediaConnectionRestored = (dispatch: IStore["dispatch"], state: ConnectionState) => {
    console.log("[CONNECTION_NOTIFICATIONS] Media connection restored (ICE)");

    if (state.wasMediaConnectionInterrupted) {
        showConnectionRestoredNotification(dispatch);
        state.wasMediaConnectionInterrupted = false;
    } else {
        console.log("[CONNECTION_NOTIFICATIONS] Skipping notification - no previous interruption");
    }
};

/**
 * Handles when device is suspended (laptop closed, mobile app backgrounded)
 * Connection will be restored when device wakes up
 *
 * @param dispatch - Redux dispatch function
 */
export const handleDeviceSuspended = (dispatch: IStore['dispatch']) => {
    console.log('[CONNECTION_NOTIFICATIONS] Device suspended detected');
    showDeviceSuspendedNotification(dispatch);
};
