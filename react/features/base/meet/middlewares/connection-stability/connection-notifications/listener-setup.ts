import { IStore } from '../../../../../app/types';
import { JitsiConferenceEvents, JitsiConnectionEvents } from '../../../../lib-jitsi-meet';
import {
    handleDeviceSuspended,
    handleMediaConnectionInterrupted,
    handleMediaConnectionRestored,
} from './event-handlers.conference';
import {
    handleXMPPConnected,
    handleXMPPConnectionFailed,
    handleXMPPDisconnected,
} from './event-handlers.connection';
import { ConnectionState } from './types';

/**
 * Attaches event listeners for conference media connection events
 * These events track the ICE connection state (actual audio/video transport)
 *
 * @param conference - Jitsi conference instance
 * @param dispatch - Redux dispatch function
 * @param state - Connection state to track listener registration
 */
export const setupConferenceMediaListeners = (
    conference: any,
    dispatch: IStore["dispatch"],
    state: ConnectionState
) => {
    if (state.hasConferenceListeners || !conference) {
        return;
    }

    conference.addEventListener(JitsiConferenceEvents.CONNECTION_INTERRUPTED, () =>
        handleMediaConnectionInterrupted(dispatch, state)
    );

    conference.addEventListener(JitsiConferenceEvents.CONNECTION_RESTORED, () =>
        handleMediaConnectionRestored(dispatch, state)
    );

    conference.addEventListener(JitsiConferenceEvents.SUSPEND_DETECTED, () => handleDeviceSuspended(dispatch));

    state.hasConferenceListeners = true;
};

/**
 * Attaches event listeners for XMPP connection events
 * These events track the signaling connection (WebSocket to XMPP server)
 *
 * @param connection - Jitsi connection instance
 * @param dispatch - Redux dispatch function
 * @param state - Connection state to track listener registration
 */
export const setupXMPPConnectionListeners = (connection: any, dispatch: IStore["dispatch"], state: ConnectionState) => {
    if (!connection || state.hasConnectionListeners) {
        return;
    }

    connection.addEventListener(JitsiConnectionEvents.CONNECTION_ESTABLISHED, () => handleXMPPConnected());

    connection.addEventListener(JitsiConnectionEvents.CONNECTION_DISCONNECTED, (message: string) =>
        handleXMPPDisconnected(dispatch, message)
    );

    connection.addEventListener(JitsiConnectionEvents.CONNECTION_FAILED, (error: any, message: string) =>
        handleXMPPConnectionFailed(dispatch, error, message)
    );

    state.hasConnectionListeners = true;
};
