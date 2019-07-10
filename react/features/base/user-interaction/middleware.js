// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';
import { MiddlewareRegistry } from '../redux';

import {
    SET_USER_INTERACTION_LISTENER,
    USER_INTERACTION_RECEIVED
} from './actionTypes';

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
    case USER_INTERACTION_RECEIVED:
        _stopListeningForUserInteraction(store);
        break;
    }

    return next(action);
});

/**
 * Registers listeners to notify redux of any user interaction with the page.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _startListeningForUserInteraction(store) {
    const userInteractionListener = event => {
        if (event.isTrusted) {
            store.dispatch({
                type: USER_INTERACTION_RECEIVED
            });

            _stopListeningForUserInteraction(store);
        }
    };

    window.addEventListener('mousedown', userInteractionListener);
    window.addEventListener('keydown', userInteractionListener);

    store.dispatch({
        type: SET_USER_INTERACTION_LISTENER,
        userInteractionListener
    });
}

/**
 * Un-registers listeners intended to notify when the user has interacted with
 * the page.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _stopListeningForUserInteraction({ getState, dispatch }) {
    const { userInteractionListener } = getState()['features/base/app'];

    if (userInteractionListener) {
        window.removeEventListener('mousedown', userInteractionListener);
        window.removeEventListener('keydown', userInteractionListener);

        dispatch({
            type: SET_USER_INTERACTION_LISTENER,
            userInteractionListener: undefined
        });
    }
}
