import { AnyAction } from 'redux';
import { IStore } from '../../../../app/types';
import { hideNotification, showNotification } from '../../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../../notifications/constants';
import { DATA_CHANNEL_CLOSED, DATA_CHANNEL_OPENED } from '../../../conference/actionTypes';
import MiddlewareRegistry from '../../../redux/MiddlewareRegistry';

// Notification IDs
const DATACHANNEL_RECONNECTION_NOTIFICATION_ID = 'datachannel.reconnecting';
const DATACHANNEL_FAILED_NOTIFICATION_ID = 'datachannel.failed';

// Timing constants
const RECONNECTION_TIMEOUT_MS = 15000;
const RESET_COUNTER_TIMEOUT_MS = 60000;
const PERSISTENT_ISSUE_THRESHOLD = 3;

// State tracking
let isDataChannelClosed = false;
let dataChannelCloseCount = 0;
let resetCounterTimer: number | null = null;
let reconnectionTimeoutTimer: number | null = null;

/**
 * Clears all active timers.
 */
const clearAllTimers = () => {
    if (resetCounterTimer) {
        clearTimeout(resetCounterTimer);
        resetCounterTimer = null;
    }
    if (reconnectionTimeoutTimer) {
        clearTimeout(reconnectionTimeoutTimer);
        reconnectionTimeoutTimer = null;
    }
};

/**
 * Resets the data channel state to initial values.
 */
const resetDataChannelState = () => {
    dataChannelCloseCount = 0;
    isDataChannelClosed = false;
};

/**
 * Shows the initial data channel closed notification.
 */
const showDataChannelClosedNotification = (store: IStore) => {
    store.dispatch(
        showNotification(
            {
                titleKey: "notify.dataChannelClosed",
                descriptionKey: "notify.dataChannelClosedDescription",
                uid: DATACHANNEL_RECONNECTION_NOTIFICATION_ID,
            },
            NOTIFICATION_TIMEOUT_TYPE.STICKY
        )
    );
};

/**
 * Shows the reconnection failed notification after timeout.
 */
const showReconnectionFailedNotification = (store: IStore) => {
    store.dispatch(hideNotification(DATACHANNEL_RECONNECTION_NOTIFICATION_ID));
    store.dispatch(
        showNotification(
            {
                titleKey: "dialog.conferenceDisconnectTitle",
                descriptionKey: "dialog.conferenceDisconnectMsg",
                uid: DATACHANNEL_FAILED_NOTIFICATION_ID,
            },
            NOTIFICATION_TIMEOUT_TYPE.STICKY
        )
    );
};

/**
 * Shows the persistent issue notification when channel closes multiple times.
 */
const showPersistentIssueNotification = (store: IStore) => {
    store.dispatch(hideNotification(DATACHANNEL_RECONNECTION_NOTIFICATION_ID));
    store.dispatch(
        showNotification(
            {
                titleKey: "notify.connectionFailed",
                descriptionKey: "dialog.conferenceDisconnectMsg",
                uid: DATACHANNEL_FAILED_NOTIFICATION_ID,
            },
            NOTIFICATION_TIMEOUT_TYPE.STICKY
        )
    );
};

/**
 * Hides all data channel notifications.
 */
const hideAllNotifications = (store: IStore) => {
    store.dispatch(hideNotification(DATACHANNEL_RECONNECTION_NOTIFICATION_ID));
    store.dispatch(hideNotification(DATACHANNEL_FAILED_NOTIFICATION_ID));
};

/**
 * Schedules a timeout to detect reconnection failure.
 */
const scheduleReconnectionTimeout = (store: IStore) => {
    if (reconnectionTimeoutTimer) {
        clearTimeout(reconnectionTimeoutTimer);
    }
    reconnectionTimeoutTimer = setTimeout(() => {
        if (isDataChannelClosed) {
            console.error(`Data channel failed to reconnect after ${RECONNECTION_TIMEOUT_MS / 1000} seconds`);
            showReconnectionFailedNotification(store);
        }
    }, RECONNECTION_TIMEOUT_MS);
};

/**
 * Schedules a timeout to reset the close counter.
 */
const scheduleCounterReset = () => {
    if (resetCounterTimer) {
        clearTimeout(resetCounterTimer);
    }
    resetCounterTimer = setTimeout(() => {
        dataChannelCloseCount = 0;
    }, RESET_COUNTER_TIMEOUT_MS);
};

/**
 * Middleware to handle BridgeChannel (DataChannel) connection issues.
 * When the DataChannel closes unexpectedly, notify the user.
 * lib-jitsi-meet will automatically attempt to reconnect the datachannel.
 */
MiddlewareRegistry.register((store) => (next) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
        case DATA_CHANNEL_OPENED: {
            console.log("Data channel opened successfully");

            clearAllTimers();
            resetDataChannelState();

            if (isDataChannelClosed) {
                hideAllNotifications(store);
            }

            break;
        }

        case DATA_CHANNEL_CLOSED: {
            const { code, reason } = action;
            console.warn(`Data channel closed unexpectedly - code: ${code}, reason: ${reason}`);

            dataChannelCloseCount++;
            isDataChannelClosed = true;

            const isPersistentIssue = dataChannelCloseCount >= PERSISTENT_ISSUE_THRESHOLD;

            if (isPersistentIssue) {
                console.error(`Data channel closed ${dataChannelCloseCount} times, persistent connection issue`);
                showPersistentIssueNotification(store);
            } else {
                showDataChannelClosedNotification(store);
                scheduleReconnectionTimeout(store);
            }

            scheduleCounterReset();

            break;
        }
    }

    return result;
});

// Export something to prevent tree-shaking
export default {};
