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
        // This have to be executed before we remove the participant from features/base/participants state in order to
        // remove the related thumbnail component before we need to re-render it. If we do this after next()
        // we will be in sitation where the participant exists in the remoteParticipants array in features/filmstrip
        // but doesn't exist in features/base/participants state which will lead to rendering a thumbnail for
        // non-existing participant.
        updateRemoteParticipantsOnLeave(store, action.participant?.id);
    }

    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED:
    case SET_ASPECT_RATIO:
        store.dispatch(setTileViewDimensions());
        break;
    case PARTICIPANT_JOINED: {
        updateRemoteParticipants(store, action.participant?.id);
        break;
    }
    }

    return result;
});
