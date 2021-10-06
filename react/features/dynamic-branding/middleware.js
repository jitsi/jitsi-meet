// @flow

import { APP_WILL_MOUNT } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';

import { fetchCustomBrandingData } from './actions';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT: {

        store.dispatch(fetchCustomBrandingData());
        break;
    }
    }

    return next(action);
});
