import { APP_WILL_MOUNT } from '../base/app/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData } from './actions.any';
import { createMuiBrandingTheme } from './functions.web';

import './middleware.any';

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
