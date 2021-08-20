// @flow

import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED, SET_ASPECT_RATIO } from '../base/responsive-ui';

import { setTileViewDimensions } from './actions';
import { updateRemoteParticipants, updateRemoteParticipantsOnLeave } from './functions';
import './subscriber';

/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    if (action.type === PARTICIPANT_LEFT) {
        updateRemoteParticipantsOnLeave(store, action.participant?.id);
    }

    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED:
    case SET_ASPECT_RATIO:
        store.dispatch(setTileViewDimensions());
        break;
    case PARTICIPANT_JOINED: {
        updateRemoteParticipants(store);
        break;
    }
    }

    return result;
});
