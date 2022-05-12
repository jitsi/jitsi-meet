import { SET_CONFIG } from '../base/config';
import { CONNECTION_DISCONNECTED } from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomBrandingData, unsetDynamicBranding } from './actions.native';


MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case SET_CONFIG: {
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

        return result;
    }
    }

    return result;
});
