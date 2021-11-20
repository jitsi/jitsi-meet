// @flow

import { APP_WILL_MOUNT } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData } from './actions';
import { createMuiBrandingTheme } from './functions.web';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT: {

        store.dispatch(fetchCustomBrandingData());
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
