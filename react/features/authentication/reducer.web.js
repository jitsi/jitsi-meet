/* @flow */

import { ReducerRegistry } from '../base/redux';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_STARTED,
    WAIT_FOR_OWNER
} from './actionTypes';

ReducerRegistry.register('features/authentication', (state = {}, action) => {
    switch (action.type) {

    case WAIT_FOR_OWNER:
        return {
            ...state,
            waitForOwnerTimeoutID: action.waitForOwnerTimeoutID
        };

    case STOP_WAIT_FOR_OWNER:
        return {
            ...state,
            error: undefined,
            waitForOwnerTimeoutID: undefined
        };

    case CANCEL_LOGIN:
        return {
            ...state,
            error: undefined,
            progress: undefined,
            thenableWithCancel: undefined
        };

    case UPGRADE_ROLE_STARTED:
        return {
            ...state,
<<<<<<< HEAD
            error: action.error,
            progress: action.progress,
=======
            error: undefined,
            progress: undefined,
>>>>>>> f460d8dacb7bdf64e005dd84d2d78ec372a75056
            thenableWithCancel: action.thenableWithCancel
        };

    case UPGRADE_ROLE_FINISHED: {
        let { thenableWithCancel } = action;

        if (state.thenableWithCancel === thenableWithCancel) {
            const { error, progress } = action;

            if (error || progress === 1) {
                thenableWithCancel = undefined;
            }

            return {
                ...state,
                error,
                progress: progress || undefined,
                thenableWithCancel
            };
        }
        break;
    }

    }

    return state;
});
