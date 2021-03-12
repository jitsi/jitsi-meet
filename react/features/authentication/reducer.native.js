/* @flow */

import { assign, ReducerRegistry } from '../base/redux';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_STARTED,
    WAIT_FOR_OWNER
} from './actionTypes';

ReducerRegistry.register('features/authentication', (state = {}, action) => {
    switch (action.type) {
    case CANCEL_LOGIN:
        return assign(state, {
            error: undefined,
            progress: undefined,
            thenableWithCancel: undefined
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
