import { batch } from "react-redux";
import { AnyAction } from "redux";
import { IStore } from "../../../../app/types";
import { hideNotification } from "../../../../notifications/actions";
import { CONFERENCE_WILL_LEAVE } from "../../../conference/actionTypes";
import { isLeavingConferenceManually, setLeaveConferenceManually } from "../../general/utils/conferenceState";
import { CONNECTION_DISCONNECTED, CONNECTION_ESTABLISHED, CONNECTION_FAILED } from "../../../connection/actionTypes";
import { connect } from "../../../connection/actions.web";
import { setJWT } from "../../../jwt/actions";
import MiddlewareRegistry from "../../../redux/MiddlewareRegistry";
import { trackRemoved } from "../../../tracks/actions.any";
import { hideLoader, showLoader } from "../../loader";

const RECONNECTION_NOTIFICATION_ID = "connection.reconnecting";
const RECONNECTION_LOADER_ID = "auto-reconnect";
const RECONNECTION_WAIT_TIME_MS = 15000;
const MAX_RECONNECTION_ATTEMPTS = 2;
const RECONNECTION_DELAY_MS = 3000;
const JWT_EXPIRED_ERROR = "connection.passwordRequired";

let reconnectionTimer: number | null = null;
let isReconnecting = false;
let reconnectionAttempts = 0;

export const isAutoReconnecting = () => isReconnecting;

const hideReconnectionNotification = (store: IStore) => {
    store.dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
};

const showReconnectionLoader = (store: IStore, attempt: number) => {
    const textKey = attempt <= MAX_RECONNECTION_ATTEMPTS ? "loader.reconnecting" : "loader.reloading";

    store.dispatch(showLoader(undefined, textKey, RECONNECTION_LOADER_ID));
};

const hideReconnectionLoader = (store: IStore) => {
    store.dispatch(hideLoader(RECONNECTION_LOADER_ID));
};

const reloadPage = () => {
    window.location.reload();
};

const clearExpiredJWT = (store: IStore) => {
    store.dispatch(setJWT(undefined));
};

const clearRemoteTracks = (store: IStore) => {
    const state = store.getState();
    const remoteTracks = state["features/base/tracks"].filter((t) => !t.local);

    batch(() => {
        for (const track of remoteTracks) {
            store.dispatch(trackRemoved(track.jitsiTrack));
        }
    });
};

const triggerReconnection = (store: IStore) => {
    store.dispatch(connect());
};

const scheduleRetry = (store: IStore) => {
    reconnectionTimer = window.setTimeout(() => {
        if (!isLeavingConferenceManually() && isReconnecting) {
            attemptReconnection(store);
        }
    }, RECONNECTION_DELAY_MS);
};

const handleMaxAttemptsReached = (store: IStore) => {
    isReconnecting = true;
    showReconnectionLoader(store, reconnectionAttempts + 1);
    reconnectionTimer = window.setTimeout(reloadPage, 2000);
};

/**
 * Attempts to reconnect by clearing JWT and connecting to conference again.
 * If max attempts reached, reloads the page.
 */
const attemptReconnection = async (store: IStore) => {
    if (isLeavingConferenceManually()) return;

    if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        handleMaxAttemptsReached(store);
        return;
    }

    reconnectionAttempts++;
    isReconnecting = true;
    showReconnectionLoader(store, reconnectionAttempts);

    try {
        clearRemoteTracks(store);
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
            setLeaveConferenceManually(true);
            resetReconnectionState();
            hideReconnectionNotification(store);
            hideReconnectionLoader(store);
            break;
        }

        case CONNECTION_DISCONNECTED: {
            if (isLeavingConferenceManually()) break;

            clearTimer();
            reconnectionAttempts = 0;
            isReconnecting = true;

            reconnectionTimer = window.setTimeout(() => {
                if (!isLeavingConferenceManually() && isReconnecting) {
                    attemptReconnection(store);
                }
            }, RECONNECTION_WAIT_TIME_MS);

            break;
        }

        case CONNECTION_ESTABLISHED: {
            if (isReconnecting) {
                hideReconnectionNotification(store);
                hideReconnectionLoader(store);
            }

            resetReconnectionState();
            setLeaveConferenceManually(false);
            break;
        }

        case CONNECTION_FAILED: {
            const { error } = action;
            console.log("[AUTO_RECONNECT] Connection failed with error:", error);
            if (error?.name === JWT_EXPIRED_ERROR && !isLeavingConferenceManually() && !isReconnecting) {
                attemptReconnection(store);
            }

            break;
        }
    }

    return result;
});

export default {};
