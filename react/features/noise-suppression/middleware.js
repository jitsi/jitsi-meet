// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { MiddlewareRegistry } from '../base/redux';

import { TOGGLE_NOISE_SUPPRESSION } from './actionTypes';

declare var APP: Object;

/**
 * Implements middleware for the noise suppression feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case TOGGLE_NOISE_SUPPRESSION:
        // Handle noise suppression logic in `conference.js`
        APP.UI.emitEvent(UIEvents.TOGGLE_NOISE_SUPPRESSION);

        break;
    }

    return result;
});

