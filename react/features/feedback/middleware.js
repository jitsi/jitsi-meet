/* @flow */

import { MiddlewareRegistry } from '../base/redux';

import { SUBMIT_FEEDBACK } from './actionTypes';

declare var APP: Object;

/**
 * Implements the middleware of the feature feedback.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SUBMIT_FEEDBACK:
        if (typeof APP === 'object') {
            APP.API.notifyFeedbackSubmitted();
        }
        break;
    }

    return next(action);
});
