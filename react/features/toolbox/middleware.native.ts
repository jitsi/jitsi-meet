import { Platform } from 'react-native';

import { OVERWRITE_CONFIG, SET_CONFIG, UPDATE_CONFIG } from '../base/config/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { I_AM_VISITOR_MODE } from '../visitors/actionTypes';

import { SET_TOOLBAR_BUTTONS } from './actionTypes';
import { setMainToolbarThresholds } from './actions.native';
import { ANDROID_THRESHOLDS, IOS_THRESHOLDS, NATIVE_TOOLBAR_BUTTONS } from './constants';
import { getToolbarButtons } from './functions.native';

const PLATFORM_THRESHOLDS = Platform.OS === 'ios' ? IOS_THRESHOLDS : ANDROID_THRESHOLDS;


/**
 * Middleware which intercepts Toolbox actions to handle changes to the
 * visibility timeout of the Toolbox.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {

    case UPDATE_CONFIG:
    case OVERWRITE_CONFIG:
    case I_AM_VISITOR_MODE:
    case SET_CONFIG: {
        const result = next(action);
        const { dispatch } = store;
        const state = store.getState();

        const toolbarButtons = getToolbarButtons(state, NATIVE_TOOLBAR_BUTTONS);

        if (action.type !== I_AM_VISITOR_MODE) {
            dispatch(setMainToolbarThresholds(PLATFORM_THRESHOLDS));
        }

        dispatch({
            type: SET_TOOLBAR_BUTTONS,
            toolbarButtons
        });

        return result;
    }
    }

    return next(action);
});
