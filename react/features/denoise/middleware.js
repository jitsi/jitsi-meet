// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { MiddlewareRegistry } from '../base/redux';

import {
    SET_DENOISE_STATE
} from './actionTypes';
import logger from './logger';

declare var APP: Object;

/**
 * Implements the middleware of the feature screen-share.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case SET_DENOISE_STATE:
        APP.UI.emitEvent(UIEvents.SET_DENOISE_STATE, { isDenoiseActive: true });

        break;
    }

    return result;
});

