// @flow

import { hideDialog, isDialogOpen } from '../base/dialog';
import { MiddlewareRegistry } from '../base/redux';
import { SETTINGS_UPDATED } from '../base/settings';
import { DisplayNamePrompt } from './components';

/**
 * Middleware that captures actions related to display name setting.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case SETTINGS_UPDATED: {
        if (action.settings.displayName
            && isDialogOpen(getState, DisplayNamePrompt)) {
            dispatch(hideDialog(DisplayNamePrompt));
        }
    }
    }

    return next(action);
});
