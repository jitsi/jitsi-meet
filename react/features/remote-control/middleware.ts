// @ts-expect-error
import { PostMessageTransportBackend, Transport } from '@jitsi/js-utils/transport';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import {
    clearRequest, setReceiverTransport, setRemoteControlActive, stopController, stopReceiver
} from './actions';
import { REMOTE_CONTROL_MESSAGE_NAME } from './constants';
import { onRemoteControlAPIEvent } from './functions';
import './subscriber';

/**
 * The redux middleware for the remote control feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT: {
        const { dispatch } = store;

        dispatch(setReceiverTransport(new Transport({
            backend: new PostMessageTransportBackend({
                postisOptions: { scope: 'jitsi-remote-control' }
            })
        })));

        break;
    }
    case APP_WILL_UNMOUNT: {
        const { getState, dispatch } = store;
        const { transport } = getState()['features/remote-control'].receiver;

        if (transport) {
            transport.dispose();
            dispatch(setReceiverTransport());
        }

        break;
    }
    case CONFERENCE_JOINED: {
        const result = next(action);
        const { getState } = store;
        const { transport } = getState()['features/remote-control'].receiver;

        if (transport) {
            // We expect here that even if we receive the supported event earlier
            // it will be cached and we'll receive it.
            transport.on('event', (event: { name: string; type: string; }) => {
                if (event.name === REMOTE_CONTROL_MESSAGE_NAME) {
                    onRemoteControlAPIEvent(event, store);

                    return true;
                }

                return false;
            });
        }

        return result;
    }
    case PARTICIPANT_LEFT: {
        const { getState, dispatch } = store;
        const state = getState();
        const { id } = action.participant;
        const { receiver, controller } = state['features/remote-control'];
        const { requestedParticipant, controlled } = controller;

        if (id === controlled) {
            dispatch(stopController());
        }

        if (id === requestedParticipant) {
            dispatch(clearRequest());
            dispatch(setRemoteControlActive(false));
        }

        if (receiver?.controller === id) {
            dispatch(stopReceiver(false, true));
        }

        break;
    }
    }

    return next(action);
});
