import { redirectToStaticPage } from '../app/actions';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { CONNECTION_FAILED } from '../base/connection';
import { JitsiConnectionErrors } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';


import { SET_DETAILS } from './actionTypes';
import { getCustomerDetails } from './actions';
import { STATUSES } from './constants';
import { isVpaasMeeting } from './functions';

/**
 * The redux middleware for jaas.
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

    case CONNECTION_FAILED: {
        const { error } = action;

        if (!isVpaasMeeting(store.getState()) || !error) {
            break;
        }

        if (error.name === JitsiConnectionErrors.PASSWORD_REQUIRED) {
            if (error.message !== 'could not obtain public key') {
                break;
            }

            store.dispatch(redirectToStaticPage('/static/planLimit.html'));
        }
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
