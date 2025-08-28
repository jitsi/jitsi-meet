import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';

export * from './actions.any';

/**
 * Cancels the ongoing knocking and abandons the join flow.
 *
 * @returns {Function}
 */
export function cancelKnocking() {
    return async (dispatch: IStore['dispatch']) => {
        // when we are redirecting the library should handle any
        // unload and clean of the connection.
        APP.API.notifyReadyToClose();
        dispatch(maybeRedirectToWelcomePage());
    };
}
