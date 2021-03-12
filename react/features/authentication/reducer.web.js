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
    const {
        error,
        progress,
        waitForOwnerTimeoutID,
        thenableWithCancel
    } = action;

    switch (action.type) {

    case WAIT_FOR_OWNER:
        return {
            ...state,
            waitForOwnerTimeoutID
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
            error: undefined,
            progress: undefined,
            thenableWithCancel
        };

    case UPGRADE_ROLE_FINISHED: {
        if (state.thenableWithCancel === thenableWithCancel) {
            if (error || progress === 1) {
                action.thenableWithCancel = undefined;
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
