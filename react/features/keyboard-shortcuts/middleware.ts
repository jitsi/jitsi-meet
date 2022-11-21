import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { OPEN_KEYBOARD_SHORTCUTS_DIALOG } from './actionTypes';

/**
 * Implements the middleware of the feature keyboard-shortcuts.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case OPEN_KEYBOARD_SHORTCUTS_DIALOG:
        if (typeof APP === 'object') {
            APP.keyboardshortcut.openDialog();
        }
        break;
    }

    return next(action);
});
