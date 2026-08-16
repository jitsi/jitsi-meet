import { SET_CONFIG } from '../base/config/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData } from './actions.any';
import { createMuiBrandingTheme } from './functions.web';

import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG: {
        const result = next(action);

        store.dispatch(fetchCustomBrandingData());

        return result;
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
