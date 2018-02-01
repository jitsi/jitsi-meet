// @flow

import { DeviceEventEmitter } from 'react-native';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../app';
import { MiddlewareRegistry } from '../../base/redux';

import { _setListeners } from './actions';
import { _SET_PIP_LISTENERS, REQUEST_PIP_MODE } from './actionTypes';
import { enterPictureInPictureMode } from './functions';

/**
 * Middleware that handles Picture-in-Picture requests. Currently it enters
 * the native PiP mode on Android, when requested.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_PIP_LISTENERS: {
        // Remove the current/old listeners.
        const { listeners } = store.getState()['features/pip'];

        if (listeners) {
            for (const listener of listeners) {
                listener.remove();
            }
        }
        break;
    }

    case APP_WILL_MOUNT:
        _appWillMount(store);
        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(_setListeners(undefined));
        break;

    case REQUEST_PIP_MODE:
        _enterPictureInPicture(store);
        break;

    }

    return next(action);
});

/**
 * Notifies the feature pip that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _appWillMount({ dispatch, getState }) {
    const context = {
        dispatch,
        getState
    };

    const listeners = [

        // Android's onUserLeaveHint activity lifecycle callback
        DeviceEventEmitter.addListener('onUserLeaveHint', () => {
            _enterPictureInPicture(context);
        })
    ];

    dispatch(_setListeners(listeners));
}

/**
 * Helper function to enter PiP mode. This is triggered by user request
 * (either pressing the button in the toolbox or the home button on Android)
 * ans this triggers the PiP mode, iff it's available and we are in a
 * conference.
 *
 * @param {Object} store - Redux store.
 * @private
 * @returns {void}
 */
function _enterPictureInPicture({ getState }) {
    const state = getState();
    const { app } = state['features/app'];
    const { conference, joining } = state['features/base/conference'];

    if (app.props.pipAvailable && (conference || joining)) {
        enterPictureInPictureMode().catch(e => {
            console.warn(`Error entering PiP mode: ${e}`);
        });
    }
}
