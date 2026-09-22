import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { APP_WILL_MOUNT } from '../base/app/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getJitsiMeetGlobalNS } from '../base/util/helpers';
import { registerShortcut } from '../keyboard-shortcuts/actions';

import { close, setCustomPanelEnabled } from './actions.web';
import { isCustomPanelToggledOn } from './functions.web';

import './subscriber.web';

/**
 * Reveals or hides the custom panel button, and closes the panel when hiding it so that
 * an open panel cannot outlive the button that opened it.
 *
 * Note that this only reveals the button. The panel still has to be enabled through
 * `config.customPanel`, and it still needs a URL, so this cannot switch the feature on
 * in a deployment that has not configured it.
 *
 * @param {IStore} store - The redux store.
 * @param {boolean} enabled - Whether the button should be revealed.
 * @returns {void}
 */
function _setEnabled({ dispatch }: IStore, enabled: boolean) {
    dispatch(setCustomPanelEnabled(enabled));

    if (!enabled) {
        dispatch(close());
    }
}

/**
 * Registers the ways of revealing the custom panel button on web: a console helper and a
 * hidden Ctrl+Alt+E shortcut. Both are deliberate opt-ins on top of the config flag.
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const result = next(action);

    if (action.type === APP_WILL_MOUNT) {
        // Expose the toggle on the global namespace, for console access.
        getJitsiMeetGlobalNS().enableCustomPanel = (enabled = true) => _setEnabled(store, enabled);

        // No helpDescription, so the shortcut stays out of the shortcuts help dialog.
        store.dispatch(registerShortcut({
            alt: true,
            character: 'E',
            ctrl: true,
            handler: () => _setEnabled(store, !isCustomPanelToggledOn(store.getState()))
        }));
    }

    return result;
});
