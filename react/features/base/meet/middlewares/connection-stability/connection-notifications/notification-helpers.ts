import { IStore } from '../../../../../app/types';
import { showNotification, showWarningNotification } from '../../../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../../../notifications/constants';

/**
 * Shows a "Connection lost" warning notification with reconnection message
 */
export const showConnectionLostNotification = (dispatch: IStore['dispatch']) => {
    dispatch(
        showWarningNotification(
            {
                titleKey: 'notify.connectionLost',
                descriptionKey: 'notify.reconnecting',
            },
            NOTIFICATION_TIMEOUT_TYPE.LONG
        )
    );
};

/**
 * Shows a "Connected" success notification when connection is restored
 */
export const showConnectionRestoredNotification = (dispatch: IStore['dispatch']) => {
    dispatch(
        showNotification(
            {
                titleKey: 'notify.connectedTitle',
                descriptionKey: 'notify.connectedMessage',
            },
            NOTIFICATION_TIMEOUT_TYPE.SHORT
        )
    );
};

/**
 * Shows a "Connection failed" error notification with custom message
 */
export const showConnectionFailedNotification = (dispatch: IStore['dispatch'], errorMessage?: string) => {
    dispatch(
        showWarningNotification(
            {
                titleKey: 'notify.connectionFailed',
                ...(errorMessage && { descriptionKey: errorMessage }),
            },
            NOTIFICATION_TIMEOUT_TYPE.LONG
        )
    );
};

/**
 * Shows a "Device suspended" warning notification
 */
export const showDeviceSuspendedNotification = (dispatch: IStore['dispatch']) => {
    dispatch(
        showWarningNotification(
            {
                titleKey: 'notify.connectionLost',
                descriptionKey: 'notify.deviceSuspended',
            },
            NOTIFICATION_TIMEOUT_TYPE.LONG
        )
    );
};
