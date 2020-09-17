import { PARTICIPANT_JOINED } from '../base/participants/actionTypes';
import { MiddlewareRegistry } from '../base/redux';

import { SET_BILLING_ID } from './actionTypes';
import { countEndpoint } from './actions';
import { setBillingId } from './functions';

/**
 * The redux middleware for billing counter.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */

MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case SET_BILLING_ID: {
        setBillingId(action.value);

        break;
    }

    case PARTICIPANT_JOINED: {
        const shouldCount = !store.getState()['features/billing-counter'].endpointCounted
              && !action.participant.local;

        if (shouldCount) {
            store.dispatch(countEndpoint());
        }

        break;
    }
    }

    return next(action);
});
