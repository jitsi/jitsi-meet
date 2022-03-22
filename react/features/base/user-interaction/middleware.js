// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';
import { MiddlewareRegistry } from '../redux';

import { USER_INTERACTION_RECEIVED } from './actionTypes';

/**
 * Reference to any callback that has been created to be invoked on user
 * interaction.
 *
 * @type {Function|null}
 */
let userInteractionListener = null;

/**
 * Implements the entry point of the middleware of the feature base/user-interaction.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        _startListeningForUserInteraction(store);
        break;

    case APP_WILL_UNMOUNT:
        _stopListeningForUserInteraction();
        break;
    }

    return next(action);
});

/**
 * Callback invoked when the user interacts with the page.
 *
 * @param {Function} dispatch - The redux dispatch function.
 * @param {Object} event - The DOM event for a user interacting with the page.
 * @private
 * @returns {void}
 */
function _onUserInteractionReceived(dispatch, event) {
    if (event.isTrusted) {
        dispatch({
            type: USER_INTERACTION_RECEIVED
        });

        _stopListeningForUserInteraction();
    }
}

/**
 * Registers listeners to notify redux of any user interaction with the page.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _startListeningForUserInteraction({ dispatch }) {
    _stopListeningForUserInteraction();

    userInteractionListener = _onUserInteractionReceived.bind(null, dispatch);

    window.addEventListener('mousedown', userInteractionListener);
    window.addEventListener('keydown', userInteractionListener);
}

/**
 * De-registers listeners for user interaction with the page.
 *
 * @private
 * @returns {void}
 */
function _stopListeningForUserInteraction() {
    window.removeEventListener('mousedown', userInteractionListener);
    window.removeEventListener('keydown', userInteractionListener);

    userInteractionListener = null;
}
