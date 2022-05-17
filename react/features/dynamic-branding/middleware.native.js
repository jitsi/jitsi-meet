import { SET_CONFIG } from '../base/config';
import { CONNECTION_DISCONNECTED, CONNECTION_FAILED } from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData, unsetDynamicBranding } from './actions.native';


MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_FAILED: {
        store.dispatch(unsetDynamicBranding());

        return next(action);
    }

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

        action.value.avatarBackgrounds = avatarBackgrounds.filter(
            color => !color.includes('linear-gradient')
        );
        action.value.backgroundColor = backgroundColor;
        action.value.backgroundImageUrl = backgroundImageUrl;

        break;
    }

    case CONNECTION_DISCONNECTED: {
        store.dispatch(unsetDynamicBranding());

        return next(action);
    }
    }

    return next(action);
});
