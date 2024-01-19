import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_DYNAMIC_BRANDING_DATA } from './actionTypes';
import { fetchCustomIcons } from './functions.any';
import logger from './logger';

MiddlewareRegistry.register(() => next => action => {
    switch (action.type) {
    case SET_DYNAMIC_BRANDING_DATA: {
        const { customIcons } = action.value;

        if (customIcons) {
            fetchCustomIcons(customIcons)
                .then(localCustomIcons => {
                    action.value.brandedIcons = localCustomIcons;

                    return next(action);
                })
                .catch((error: any) => {
                    logger.error('Error fetching branded custom icons:', error);
                });
        }

        break;
    }
    }

    return next(action);
});
