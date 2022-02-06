// @flow

import { SET_ROOM } from '../../base/conference/actionTypes';
import { MiddlewareRegistry } from '../../base/redux';

import { navigateRoot } from './rootNavigationContainerRef';
import { screen } from './routes';


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_ROOM:
        return _setRoom(store, next, action);
    }

    return next(action);
});


/**
 * Notifies the feature base/conference that the action
 * {@code SET_ROOM} is being dispatched within a specific
 *  redux store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_ROOM}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setRoom(store, next, action) {
    const { room: oldRoom } = store.getState()['features/base/conference'];
    const result = next(action);
    const { room: newRoom } = store.getState()['features/base/conference'];

    if (!oldRoom && newRoom) {
        navigateRoot(screen.conference.root);
    } else if (!newRoom) {
        navigateRoot(screen.root);
    }

    return result;
}
