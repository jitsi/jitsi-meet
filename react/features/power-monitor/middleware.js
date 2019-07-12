// @flow

import {
    setTransport,
    suspendDetected
} from './actions';
import { SUSPEND_DETECTED } from './actionTypes';

import {
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';
import {
    PostMessageTransportBackend,
    Transport
} from '../../../modules/transport';
import { destroyLocalTracks } from '../base/tracks';

declare var APP: Object;

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {

        // listens for messages about suspend from power-monitor
        const transport = new Transport({
            backend: new PostMessageTransportBackend({
                postisOptions: { scope: 'jitsi-power-monitor' }
            })
        });

        transport.on('event', event => {
            if (event && event.name === 'power-monitor' && event.event === 'suspend') {

                dispatch(suspendDetected());

                return true;
            }

            return false;
        });

        dispatch(setTransport(transport));
        break;
    }

    case CONFERENCE_LEFT: {
        const { transport } = getState()['features/power-monitor'];

        if (transport) {
            transport.dispose();
        }

        dispatch(setTransport());
        break;
    }

    case SUSPEND_DETECTED: {
        dispatch(destroyLocalTracks());

        // FIXME: when refactoring conference.js
        APP.conference.onSuspendDetected();

        APP.API.notifySuspendDetected();
        break;
    }
    }

    return result;
});
