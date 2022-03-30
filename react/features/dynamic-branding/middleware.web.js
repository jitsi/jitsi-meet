// @flow

import { SET_CONFIG, UPDATE_CONFIG, OVERWRITE_CONFIG } from '../base/config';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData } from './actions';
import { createMuiBrandingTheme } from './functions.web';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG:
    case UPDATE_CONFIG:
    case OVERWRITE_CONFIG: {

        store.dispatch(fetchCustomBrandingData(action));
        break;
    }
    case SET_DYNAMIC_BRANDING_DATA: {
        const { customTheme } = action.value;

        if (customTheme) {
            action.value.muiBrandedTheme = createMuiBrandingTheme(customTheme);
        }
    }
    }

    return next(action);
});
