import {
    PIN_PARTICIPANT,
    getPinnedParticipant,
    pinParticipant
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import { SET_TILE_VIEW } from './actionTypes';
import { setTileView } from './actions';

/**
 * Middleware which intercepts actions and updates tile view related state.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case PIN_PARTICIPANT: {
        const isPinning = Boolean(action.participant.id);
        const { tileViewEnabled } = store.getState()['features/video-layout'];

        if (isPinning && tileViewEnabled) {
            store.dispatch(setTileView(false));
        }

        break;
    }

    case SET_TILE_VIEW:
        if (getPinnedParticipant(store.getState()) && action.enabled) {
            store.dispatch(pinParticipant(null));
        }

        break;
    }

    return next(action);
});
