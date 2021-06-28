import { redirectToStaticPage } from '../app/actions';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { MiddlewareRegistry } from '../base/redux';

import { SET_DETAILS } from './actionTypes';
import { getCustomerDetails } from './actions';
import { STATUSES } from './constants';

/**
 * The redux middleware for billing counter.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */

MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        store.dispatch(getCustomerDetails());
        break;
    }

    case SET_DETAILS: {
        const { status } = action.payload;

        if (status === STATUSES.BLOCKED) {
            store.dispatch(redirectToStaticPage('/static/planLimit.html'));
        }
    }
    }

    return next(action);
});
