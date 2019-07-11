// @flow

import { BackHandler } from 'react-native';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import { MiddlewareRegistry } from '../../base/redux';

import BackButtonRegistry from './BackButtonRegistry';

// Binding function to the proper instance, so then the event emitter won't replace the
// underlying instance.
BackButtonRegistry.onHardwareBackPress = BackButtonRegistry.onHardwareBackPress.bind(BackButtonRegistry);

/**
 * Middleware that captures App lifetime actions and subscribes to application
 * state changes. When the application state changes it will fire the action
 * required to mute or unmute the local video in case the application goes to
 * the background or comes back from it.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
MiddlewareRegistry.register(() => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        BackHandler.addEventListener('hardwareBackPress', BackButtonRegistry.onHardwareBackPress);
        break;

    case APP_WILL_UNMOUNT:
        BackHandler.removeEventListener('hardwareBackPress', BackButtonRegistry.onHardwareBackPress);
        break;
    }

    return next(action);
});
