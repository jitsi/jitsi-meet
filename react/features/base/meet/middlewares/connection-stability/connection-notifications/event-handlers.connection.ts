import { IStore } from '../../../../../app/types';
import { ConnectionState } from './types';
import {
    showConnectionLostNotification,
    showConnectionFailedNotification,
} from './notification-helpers';

/**
 * Handles when XMPP connection is established
 * This is the signaling connection, not media
 */
export const handleXMPPConnected = () => {
    console.log('[CONNECTION_NOTIFICATIONS] XMPP connection established');
};

/**
 * Handles when XMPP WebSocket is disconnected
 * Only shows notification if not a manual disconnect (user clicking hangup)
 *
 * @param dispatch - Redux dispatch function
 * @param message - Disconnect message from lib-jitsi-meet
 * @param state - Connection state to check if manual disconnect
 */
export const handleXMPPDisconnected = (
    dispatch: IStore['dispatch'],
    message: string,
    state: ConnectionState
) => {
    console.log('[CONNECTION_NOTIFICATIONS] XMPP disconnected:', message);

    if (state.isManualDisconnect) {
        console.log('[CONNECTION_NOTIFICATIONS] Manual disconnect, skipping notification');
        return;
    }

    showConnectionLostNotification(dispatch);
};

/**
 * Handles when XMPP connection fails to establish or encounters fatal error
 * This is more severe than disconnect - connection couldn't be made at all
 *
 * @param dispatch - Redux dispatch function
 * @param error - Error object from lib-jitsi-meet
 * @param message - Error message
 */
export const handleXMPPConnectionFailed = (
    dispatch: IStore['dispatch'],
    error: any,
    message: string
) => {
    console.error('[CONNECTION_NOTIFICATIONS] XMPP connection failed:', error, message);
    showConnectionFailedNotification(dispatch, message);
};
