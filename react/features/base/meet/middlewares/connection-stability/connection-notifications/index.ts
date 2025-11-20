import { AnyAction } from 'redux';
import { IStore } from '../../../../../app/types';
import { CONFERENCE_JOINED, CONFERENCE_WILL_LEAVE } from '../../../../conference/actionTypes';
import { setLeaveConferenceManually } from '../../../general/utils/conferenceState';
import { CONNECTION_WILL_CONNECT } from '../../../../connection/actionTypes';
import MiddlewareRegistry from '../../../../redux/MiddlewareRegistry';
import { setupConferenceMediaListeners, setupXMPPConnectionListeners } from './listener-setup';
import { createConnectionState } from './state';

/**
 * Middleware that listens to Redux actions and sets up lib-jitsi-meet event listeners
 *
 * Flow:
 * 1. CONNECTION_WILL_CONNECT -> Setup XMPP listeners
 * 2. CONFERENCE_JOINED -> Setup ICE/media listeners
 * 3. CONFERENCE_WILL_LEAVE -> Mark as manual disconnect, cleanup flags
 */
MiddlewareRegistry.register(({ dispatch }: IStore) => {
    const connectionState = createConnectionState();

    return (next: Function) =>
        (action: AnyAction) => {
            const result = next(action);

            switch (action.type) {
                case CONNECTION_WILL_CONNECT: {
                    setLeaveConferenceManually(false);
                    connectionState.hasConnectionListeners = false;

                    const { connection } = action;

                    setupXMPPConnectionListeners(connection, dispatch, connectionState);
                    break;
                }

                case CONFERENCE_JOINED: {
                    const { conference } = action;

                    setupConferenceMediaListeners(conference, dispatch, connectionState);
                    break;
                }

                case CONFERENCE_WILL_LEAVE: {
                    // User clicked hangup button - don't show reconnection notifications
                    setLeaveConferenceManually(true);
                    connectionState.hasConferenceListeners = false;
                    connectionState.wasMediaConnectionInterrupted = false;
                    break;
                }
            }

            return result;
        };
});
