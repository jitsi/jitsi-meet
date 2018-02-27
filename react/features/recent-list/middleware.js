// @flow

import { CONFERENCE_WILL_LEAVE, SET_ROOM } from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

import { storeCurrentConference, updateConferenceDuration } from './actions';

/**
 * Middleware that captures joined rooms so they can be saved into
 * {@code window.localStorage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_WILL_LEAVE:
        _updateConferenceDuration(store);
        break;

    case SET_ROOM:
        _maybeStoreCurrentConference(store, action);
        break;
    }

    return next(action);
});

/**
 * Checks if there is a current conference (upon SET_ROOM action), and saves it
 * if necessary.
 *
 * @param {Store} store - The redux store.
 * @param {Dispatch} next - The redux {@code dispatch} function.
 * @param {Action} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeStoreCurrentConference({ dispatch, getState }, { room }) {
    if (room) {
        const { locationURL } = getState()['features/base/connection'];

        dispatch(storeCurrentConference(locationURL));
    }
}

/**
 * Updates the duration of the last conference stored in the list.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _updateConferenceDuration({ dispatch, getState }) {
    const { locationURL } = getState()['features/base/connection'];

    dispatch(updateConferenceDuration(locationURL));
}
