import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';
import { assign } from '../base/redux/functions';

import {
    CANCEL_LOGIN,
    SET_TOKEN_AUTH_URL_SUCCESS,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_STARTED,
    WAIT_FOR_OWNER
} from './actionTypes';

export interface IAuthenticationState {
    error?: Object | undefined;
    progress?: number | undefined;
    thenableWithCancel?: {
        cancel: Function;
    };
    tokenAuthUrlSuccessful?: boolean;
    waitForOwnerTimeoutID?: number;
}

/**
 * Sets up the persistence of the feature {@code authentication}.
 */
PersistenceRegistry.register('features/authentication', {
    tokenAuthUrlSuccessful: true
});

/**
 * Listens for actions which change the state of the authentication feature.
 *
 * @param {Object} state - The Redux state of the authentication feature.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @returns {Object}
 */
ReducerRegistry.register<IAuthenticationState>('features/authentication',
(state = {}, action): IAuthenticationState => {
    switch (action.type) {
    case CANCEL_LOGIN:
        return assign(state, {
            error: undefined,
            progress: undefined,
            thenableWithCancel: undefined
        });
    case SET_TOKEN_AUTH_URL_SUCCESS:
        return assign(state, {
            tokenAuthUrlSuccessful: action.value
        });

    case STOP_WAIT_FOR_OWNER:
        return assign(state, {
            error: undefined,
            waitForOwnerTimeoutID: undefined
        });

    case UPGRADE_ROLE_FINISHED: {
        let { thenableWithCancel } = action;

        if (state.thenableWithCancel === thenableWithCancel) {
            const { error, progress } = action;

            // An error interrupts the process of authenticating and upgrading
            // the role of the local participant/user i.e. the process is no
            // more. Obviously, the process seizes to exist also when it does
            // its whole job.
            if (error || progress === 1) {
                thenableWithCancel = undefined;
            }

            return assign(state, {
                error,
                progress: progress || undefined,
                thenableWithCancel
            });
        }
        break;
    }

    case UPGRADE_ROLE_STARTED:
        return assign(state, {
            error: undefined,
            progress: undefined,
            thenableWithCancel: action.thenableWithCancel
        });

    case WAIT_FOR_OWNER:
        return assign(state, {
            waitForOwnerTimeoutID: action.waitForOwnerTimeoutID
        });
    }

    return state;
});
