import { redirectToStaticPage } from '../app/actions';
import { MiddlewareRegistry } from '../base/redux';


import { SET_DETAILS } from './actionTypes';
import { STATUSES } from './constants';

/**
 * The redux middleware for jaas.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case SET_DETAILS: {
        const { status } = action.payload;

        if (status === STATUSES.BLOCKED) {
            store.dispatch(redirectToStaticPage('/static/planLimit.html'));
        }
    }
    }

    return next(action);
});
