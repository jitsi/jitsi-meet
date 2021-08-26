// @flow

import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import { updateRemoteParticipants, updateRemoteParticipantsOnLeave } from './functions';
import './subscriber';

/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case PARTICIPANT_JOINED: {
        updateRemoteParticipants(store);
        break;
    }
    case PARTICIPANT_LEFT: {
        updateRemoteParticipantsOnLeave(store, action.participant?.id);
        break;
    }
    }

    return result;
});

