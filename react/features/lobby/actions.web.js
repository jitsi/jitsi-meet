// @flow

import { type Dispatch } from 'redux';

import { maybeRedirectToWelcomePage } from '../app/actions';

export * from './actions.any';

declare var APP: Object;

/**
 * Cancels the ongoing knocking and abandons the join flow.
 *
 * @returns {Function}
 */
export function cancelKnocking() {
    return async (dispatch: Dispatch<any>) => {
        // when we are redirecting the library should handle any
        // unload and clean of the connection.
        APP.API.notifyReadyToClose();
        dispatch(maybeRedirectToWelcomePage());
    };
}
