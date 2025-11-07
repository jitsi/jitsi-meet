import { AnyAction } from 'redux';
import { IStore } from '../../../../app/types';
import { hideNotification, showWarningNotification } from "../../../../notifications/actions";
import { NOTIFICATION_TIMEOUT_TYPE } from "../../../../notifications/constants";
import { CONFERENCE_WILL_LEAVE } from "../../../conference/actionTypes";
import { CONNECTION_DISCONNECTED, CONNECTION_ESTABLISHED, CONNECTION_FAILED } from "../../../connection/actionTypes";
import { connect } from "../../../connection/actions.web";
import { setJWT } from "../../../jwt/actions";
import MiddlewareRegistry from "../../../redux/MiddlewareRegistry";

const RECONNECTION_NOTIFICATION_ID = "connection.reconnecting";
const RECONNECTION_WAIT_TIME_MS = 15000;
const MAX_RECONNECTION_ATTEMPTS = 2;
const RECONNECTION_DELAY_MS = 3000;
//TODO: Need to check this is always be the same for this case
const JWT_EXPIRED_ERROR = "connection.passwordRequired";

let isManualDisconnect = false;
let reconnectionTimer: number | null = null;
let isReconnecting = false;
let reconnectionAttempts = 0;

export const isAutoReconnecting = () => isReconnecting;

const showReconnectionNotification = (store: IStore, attempt: number) => {
    const descriptionKey =
        attempt <= MAX_RECONNECTION_ATTEMPTS ? "notify.reconnectingAttempt" : "notify.reconnectionFailedReloading";

    store.dispatch(
        showWarningNotification(
            {
                titleKey: "notify.reconnecting",
                descriptionKey,
                descriptionArguments: { attempt, max: MAX_RECONNECTION_ATTEMPTS },
                uid: RECONNECTION_NOTIFICATION_ID,
            },
            NOTIFICATION_TIMEOUT_TYPE.STICKY
        )
    );
};

const hideReconnectionNotification = (store: IStore) => {
    store.dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
};

const reloadPage = () => {
    window.location.reload();
};

const clearExpiredJWT = (store: IStore) => {
    store.dispatch(setJWT(undefined));
};

const triggerReconnection = (store: IStore) => {
    store.dispatch(connect());
};

const scheduleRetry = (store: IStore) => {
    reconnectionTimer = window.setTimeout(() => {
        if (!isManualDisconnect && isReconnecting) {
            attemptReconnection(store);
        }
    }, RECONNECTION_DELAY_MS);
};

const handleMaxAttemptsReached = (store: IStore) => {
    isReconnecting = true;
    showReconnectionNotification(store, reconnectionAttempts + 1);
    reconnectionTimer = window.setTimeout(reloadPage, 2000);
};

/**
 * Attempts to reconnect by clearing JWT and connecting to conference again.
 * If max attempts reached, reloads the page.
 */
const attemptReconnection = async (store: IStore) => {
    if (isManualDisconnect) return;

    if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        handleMaxAttemptsReached(store);
        return;
    }

    reconnectionAttempts++;
    isReconnecting = true;
    showReconnectionNotification(store, reconnectionAttempts);

    try {
        clearExpiredJWT(store);
        await new Promise((resolve) => setTimeout(resolve, 100));
        triggerReconnection(store);
        scheduleRetry(store);
    } catch (error) {
        console.error("[AUTO_RECONNECT] Reconnection error:", error);
        scheduleRetry(store);
    }
};

const clearTimer = () => {
    if (reconnectionTimer !== null) {
        clearTimeout(reconnectionTimer);
        reconnectionTimer = null;
    }
};

const resetReconnectionState = () => {
    clearTimer();
    reconnectionAttempts = 0;
    isReconnecting = false;
};

/**
 * Middleware that handles automatic reconnection when JWT expires or connection is lost.
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
        case CONFERENCE_WILL_LEAVE: {
            isManualDisconnect = true;
            resetReconnectionState();
            hideReconnectionNotification(store);
            break;
        }

        case CONNECTION_DISCONNECTED: {
            if (isManualDisconnect) break;

            clearTimer();
            reconnectionAttempts = 0;
            isReconnecting = true;

            reconnectionTimer = window.setTimeout(() => {
                if (!isManualDisconnect && isReconnecting) {
                    attemptReconnection(store);
                }
            }, RECONNECTION_WAIT_TIME_MS);

            break;
        }

        case CONNECTION_ESTABLISHED: {
            if (isReconnecting) {
                hideReconnectionNotification(store);
            }

            resetReconnectionState();
            isManualDisconnect = false;
            break;
        }

        case CONNECTION_FAILED: {
            const { error } = action;
            console.log("[AUTO_RECONNECT] Connection failed with error:", error);
            if (error?.name === JWT_EXPIRED_ERROR && !isManualDisconnect && !isReconnecting) {
                attemptReconnection(store);
            }

            break;
        }
    }

    return result;
});

export default {};
