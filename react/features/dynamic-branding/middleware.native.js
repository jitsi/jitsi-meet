import { SET_CONFIG } from '../base/config';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData } from './actions.native';


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG: {
        const result = next(action);

        store.dispatch(fetchCustomBrandingData());

        return result;
    }

    case SET_DYNAMIC_BRANDING_DATA: {
        const {
            avatarBackgrounds,
            backgroundColor,
            backgroundImageUrl
        } = action.value;

        action.value = {
            ...action.value,
            avatarBackgrounds,
            backgroundColor,
            backgroundImageUrl
        };
        break;
    }
    }

    return next(action);
});
