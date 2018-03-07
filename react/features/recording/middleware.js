// @flow

import { MiddlewareRegistry } from '../base/redux';
import UIEvents from '../../../service/UI/UIEvents';

import { TOGGLE_RECORDING } from './actionTypes';

declare var APP: Object;

/**
 * Implements the middleware of the feature recording.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TOGGLE_RECORDING:
        if (typeof APP === 'object') {
            APP.UI.emitEvent(UIEvents.TOGGLE_RECORDING);
        }
        break;
    }

    return next(action);
});
