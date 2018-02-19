// @flow

import { DeviceEventEmitter } from 'react-native';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../app';
import { MiddlewareRegistry } from '../../base/redux';

import { enterPictureInPicture, _setEmitterSubscriptions } from './actions';
import { _SET_EMITTER_SUBSCRIPTIONS } from './actionTypes';

/**
 * Middleware that handles Picture-in-Picture requests. Currently it enters
 * the native PiP mode on Android, when requested.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);

    case APP_WILL_UNMOUNT:
        store.dispatch(_setEmitterSubscriptions(undefined));
        break;

    case _SET_EMITTER_SUBSCRIPTIONS: {
        // Remove the current/old EventEmitter subscriptions.
        const { emitterSubscriptions } = store.getState()['features/pip'];

        if (emitterSubscriptions) {
            for (const emitterSubscription of emitterSubscriptions) {
                // XXX We may be removing an EventEmitter subscription which is
                // in both the old and new Array of EventEmitter subscriptions!
                // Thankfully, we don't have such a practical use case at the
                // time of this writing.
                emitterSubscription.remove();
            }
        }
        break;
    }
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
 * @returns {*} The value returned by {@code next(action)}.
 */
function _appWillMount({ dispatch }, next, action) {
    dispatch(_setEmitterSubscriptions([

        // Android's onUserLeaveHint activity lifecycle callback
        DeviceEventEmitter.addListener(
            'onUserLeaveHint',
            () => dispatch(enterPictureInPicture()))
    ]));

    return next(action);
}
