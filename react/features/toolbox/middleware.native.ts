import { batch } from 'react-redux';

import { SET_CONFIG } from '../base/config/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { I_AM_VISITOR_MODE } from '../visitors/actionTypes';

import { setMainToolbarThresholds } from './actions.native';
import { SET_TOOLBAR_BUTTONS } from './actionTypes';
import { NATIVE_THRESHOLDS, NATIVE_TOOLBAR_BUTTONS } from './constants';
import { getToolbarButtons } from './functions.native';


/**
 * Middleware which intercepts Toolbox actions to handle changes to the
 * visibility timeout of the Toolbox.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG: {
        const result = next(action);
        const { dispatch } = store;
        const state = store.getState();

        const toolbarButtons = getToolbarButtons(state, NATIVE_TOOLBAR_BUTTONS as string[]);

        batch(() => {
            if (action.type !== I_AM_VISITOR_MODE) {
                dispatch(setMainToolbarThresholds(NATIVE_THRESHOLDS));
            }

            dispatch({
                type: SET_TOOLBAR_BUTTONS,
                toolbarButtons
            });
        })

        return result;
    }
    }

    return next(action);
});
