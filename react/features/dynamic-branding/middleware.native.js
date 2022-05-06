import { APP_WILL_MOUNT } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';

import { fetchCustomBrandingData } from './';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT: {

        store.dispatch(fetchCustomBrandingData());
        break;
    }
    case SET_DYNAMIC_BRANDING_DATA: {
        const {
            avatarBackgrounds,
            backgroundColor,
            backgroundImageUrl
        } = action.value;

        action.value = {
            ...action.value,
            avatarBackgrounds: avatarBackgrounds.filter(
                color => !color.includes('linear-gradient')
            ),
            backgroundColor,
            backgroundImageUrl
        };
    }
    }

    return next(action);
});
