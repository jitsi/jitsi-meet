// @flow

import { AccessibilityInfo } from 'react-native';
import type { Dispatch } from 'redux';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import { MiddlewareRegistry } from '../../base/redux';

import { _UPDATE_ACCESSIBILITY_INFO } from './actionTypes';

/**
 * Reference to the screen reader state listener.
 */
let screenReaderChangedListener;

/**
 * Middleware that captures AccessibilityInfo events and stores them in Redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 * @see {@link https://reactnative.dev/docs/0.61/accessibilityinfo}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT: {
        const { dispatch } = store;

        screenReaderChangedListener = AccessibilityInfo.addEventListener(
            'screenReaderChanged',
            handleScreenReaderToggled.bind(undefined, dispatch));

        // Prime the value.
        AccessibilityInfo.isScreenReaderEnabled()
            .then(screenReaderEnabled => {
                handleScreenReaderToggled(dispatch, screenReaderEnabled);
            });
        break;
    }

    case APP_WILL_UNMOUNT: {
        if (screenReaderChangedListener) {
            screenReaderChangedListener.remove();
            screenReaderChangedListener = undefined;
        }
        break;
    }
    }

    return next(action);
});

/**
 * Update the screen reader state in Redux.
 *
 * @param {Dispatch} dispatch - The redux {@code dispatch} function.
 * @param {boolean} screenReaderEnabled - Whether a screen reader is enabled or not.
 * @private
 * @returns {void}
 */
function handleScreenReaderToggled(dispatch: Dispatch<any>, screenReaderEnabled: boolean) {
    dispatch({
        type: _UPDATE_ACCESSIBILITY_INFO,
        data: {
            screenReaderEnabled
        }
    });
}
