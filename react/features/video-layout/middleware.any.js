import {
    PIN_PARTICIPANT,
    getPinnedParticipant,
    pinParticipant
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { SET_DOCUMENT_EDITING_STATUS, toggleDocument } from '../etherpad';

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

    case SET_DOCUMENT_EDITING_STATUS:
        if (action.editing) {
            store.dispatch(setTileView(false));
        }

        break;

    case SET_TILE_VIEW: {
        const state = store.getState();

        if (action.enabled) {
            if (getPinnedParticipant(state)) {
                store.dispatch(pinParticipant(null));
            }

            if (state['features/etherpad'].editing) {
                store.dispatch(toggleDocument());
            }
        }

        break;
    }
    }

    return next(action);
});
