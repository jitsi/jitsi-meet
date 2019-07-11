// @flow

import { APP_WILL_MOUNT } from '../app';
import { MiddlewareRegistry } from '../redux';

import { USER_INTERACTION_RECEIVED } from './actionTypes';

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

            window.removeEventListener('mousedown', userInteractionListener);
            window.removeEventListener('keydown', userInteractionListener);
        }
    };

    window.addEventListener('mousedown', userInteractionListener);
    window.addEventListener('keydown', userInteractionListener);
}
