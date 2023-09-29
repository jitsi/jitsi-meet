import { hideDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { SETTINGS_UPDATED } from '../base/settings/actionTypes';

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
