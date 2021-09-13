// @flow

import { getCurrentConference } from '../base/conference';
import {
    PARTICIPANT_LEFT,
    PIN_PARTICIPANT,
    pinParticipant,
    getParticipantById,
    getPinnedParticipant
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { SET_DOCUMENT_EDITING_STATUS } from '../etherpad';
import { isFollowMeActive } from '../follow-me';

import { SET_TILE_VIEW } from './actionTypes';
import { setTileView } from './actions';
import { getAutoPinSetting, updateAutoPinnedParticipant } from './functions';

import './subscriber';

let previousTileViewEnabled;

/**
 * Middleware which intercepts actions and updates tile view related state.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {

    // we want to extract the leaving participant and check its type before actually the participant being removed.
    let shouldUpdateAutoPin = false;

    switch (action.type) {
    case PARTICIPANT_LEFT: {
        if (!getAutoPinSetting() || isFollowMeActive(store)) {
            break;
        }
        shouldUpdateAutoPin = getParticipantById(store.getState(), action.participant.id)?.isFakeParticipant;
        break;
    }
    }

    const result = next(action);

    switch (action.type) {

    // Actions that temporarily clear the user preferred state of tile view,
    // then re-set it when needed.
    case PIN_PARTICIPANT: {
        const pinnedParticipant = getPinnedParticipant(store.getState());

        if (pinnedParticipant) {
            _storeTileViewStateAndClear(store);
        } else {
            _restoreTileViewState(store);
        }
        break;
    }
    case SET_DOCUMENT_EDITING_STATUS:
        if (action.editing) {
            _storeTileViewStateAndClear(store);
        } else {
            _restoreTileViewState(store);
        }
        break;

    // Things to update when tile view state changes
    case SET_TILE_VIEW:
        if (action.enabled && getPinnedParticipant(store)) {
            store.dispatch(pinParticipant(null));
        }
    }

    if (shouldUpdateAutoPin) {
        const screenShares = store.getState()['features/video-layout'].remoteScreenShares || [];

        updateAutoPinnedParticipant(screenShares, store);
    }

    return result;
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (conference !== previousConference) {
            // conference changed, left or failed...
            // Clear tile view state.
            dispatch(setTileView());
        }
    });

/**
 * Restores tile view state, if it wasn't updated since then.
 *
 * @param {Object} store - The Redux Store.
 * @returns {void}
 */
function _restoreTileViewState({ dispatch, getState }) {
    const { tileViewEnabled } = getState()['features/video-layout'];

    if (tileViewEnabled === undefined && previousTileViewEnabled !== undefined) {
        dispatch(setTileView(previousTileViewEnabled));
    }

    previousTileViewEnabled = undefined;
}

/**
 * Stores the current tile view state and clears it.
 *
 * @param {Object} store - The Redux Store.
 * @returns {void}
 */
function _storeTileViewStateAndClear({ dispatch, getState }) {
    const { tileViewEnabled } = getState()['features/video-layout'];

    if (tileViewEnabled !== undefined) {
        previousTileViewEnabled = tileViewEnabled;
        dispatch(setTileView(undefined));
    }
}
