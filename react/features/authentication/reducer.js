/* @flow */

import { assign, ReducerRegistry } from '../base/redux';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_LOGIN_OK,
    UPGRADE_ROLE_STARTED,
    WAIT_FOR_OWNER
} from './actionTypes';

ReducerRegistry.register('features/authentication', (state = {}, action) => {
    switch (action.type) {
    case CANCEL_LOGIN:
        return assign(state, {
            upgradeRoleError: undefined,
            upgradeRoleInProgress: undefined,
            upgradeRoleLoginOk: false
        });

    case STOP_WAIT_FOR_OWNER:
        return assign(state, {
            upgradeRoleError: undefined,
            waitForOwnerTimeoutID: undefined
        });

    case UPGRADE_ROLE_FINISHED:
    case UPGRADE_ROLE_STARTED:
        return assign(state, {
            upgradeRoleError: action.error,
            upgradeRoleInProgress: action.thenableWithCancel,
            upgradeRoleLoginOk: false
        });

    case UPGRADE_ROLE_LOGIN_OK:
        return assign(state, {
            upgradeRoleLoginOk: true
        });

    case WAIT_FOR_OWNER:
        return assign(state, {
            waitForOwnerTimeoutID: action.waitForOwnerTimeoutID
        });
    }

    return state;
});
