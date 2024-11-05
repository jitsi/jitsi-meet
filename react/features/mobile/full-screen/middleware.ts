import ImmersiveMode from 'react-native-immersive-mode';

import { IStore } from '../../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../../base/redux/StateListenerRegistry';

import { _setImmersiveSubscription } from './actions';
import { shouldUseFullScreen } from './functions';
import logger from './logger';

type BarVisibilityType = {
    navigationBottomBar: boolean;
    statusBar: boolean;
};

type ImmersiveListener = (visibility: BarVisibilityType) => void;

/**
 * Middleware that captures conference actions and activates or deactivates the
 * full screen mode. On iOS it hides the status bar, and on Android it uses the
 * immersive mode:
 * https://developer.android.com/training/system-ui/immersive.html
 * In immersive mode the status and navigation bars are hidden and thus the
 * entire screen will be covered by our application.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT: {
        _setImmersiveListener(store, _onImmersiveChange.bind(undefined, store));

        break;
    }

    case APP_WILL_UNMOUNT:
        _setImmersiveListener(store, undefined);
        break;

    }

    return next(action);
});

StateListenerRegistry.register(
    /* selector */ shouldUseFullScreen,
    /* listener */ fullScreen => _setFullScreen(fullScreen)
);

/**
 * Handler for Immersive mode changes. This will be called when Android's
 * immersive mode changes. This can happen without us wanting, so re-evaluate if
 * immersive mode is desired and reactivate it if needed.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _onImmersiveChange({ getState }: IStore) {
    const state = getState();
    const { appState } = state['features/mobile/background'];

    if (appState === 'active') {
        _setFullScreen(shouldUseFullScreen(state));
    }
}

/**
 * Activates/deactivates the full screen mode. On iOS it will hide the status
 * bar, and on Android it will turn immersive mode on.
 *
 * @param {boolean} fullScreen - True to set full screen mode, false to
 * deactivate it.
 * @private
 * @returns {void}
 */
function _setFullScreen(fullScreen: boolean) {
    logger.info(`Setting full-screen mode: ${fullScreen}`);
    ImmersiveMode.fullLayout(fullScreen);
    ImmersiveMode.setBarMode(fullScreen ? 'Full' : 'Normal');
}

/**
 * Notifies the feature filmstrip that the action
 * {@link _SET_IMMERSIVE_LISTENER} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified action is being
 * dispatched.
 * @param {Function} listener - Listener for immersive state.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setImmersiveListener({ dispatch, getState }: IStore, listener?: ImmersiveListener) {
    const { subscription } = getState()['features/full-screen'];

    subscription?.remove();

    dispatch(_setImmersiveSubscription(listener ? ImmersiveMode.addEventListener(listener) : undefined));
}
