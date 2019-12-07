// @flow

import { Dimensions } from 'react-native';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import { MiddlewareRegistry } from '../../base/redux';

import { setAspectRatio, setReducedUI } from './actions';

/**
 * Dimensions change handler.
 */
let handler;

/**
 * Middleware that handles widnow dimension changes and updates the aspect ratio and
 * reduced UI modes accordingly.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_UNMOUNT: {
        _appWillUnmount();
        break;
    }
    case APP_WILL_MOUNT:
        _appWillMount(store);
        break;

    }

    return result;
});

/**
 * Notifies this feature that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @private
 * @returns {void}
 */
function _appWillMount(store) {
    handler = dim => {
        _onDimensionsChange(dim, store);
    };

    Dimensions.addEventListener('change', handler);
}

/**
 * Notifies this feature that the action {@link APP_WILL_UNMOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @private
 * @returns {void}
 */
function _appWillUnmount() {
    Dimensions.removeEventListener('change', handler);

    handler = undefined;
}

/**
 * Handles window dimension changes.
 *
 * @param {Object} dimensions - The new dimensions.
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _onDimensionsChange(dimensions, store) {
    const { width, height } = dimensions.window;
    const { dispatch } = store;

    dispatch(setAspectRatio(width, height));
    dispatch(setReducedUI(width, height));
}
