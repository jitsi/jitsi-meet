import { assign } from '../base/redux/functions';
import { ReducerRegistry } from '../base/redux';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FAILED, UPGRADE_ROLE_STARTED, UPGRADE_ROLE_SUCCESS,
    WAIT_FOR_OWNER
} from './actionTypes';

ReducerRegistry.register('features/authentication', (state = { }, action) => {
    switch (action.type) {
    case WAIT_FOR_OWNER:
        return assign(state, {
            waitForOwnerTimeoutID: action.waitForOwnerTimeoutID
        });
    case UPGRADE_ROLE_STARTED:
        return assign(state, {
            upgradeRoleError: undefined,
            upgradeRoleInProgress: action.authConnection
        });
    case UPGRADE_ROLE_SUCCESS:
        return assign(state, {
            upgradeRoleError: undefined,
            upgradeRoleInProgress: undefined
        });
    case UPGRADE_ROLE_FAILED:
        return assign(state, {
            upgradeRoleError: action.error,
            upgradeRoleInProgress: undefined
        });
    case CANCEL_LOGIN:
        return assign(state, {
            upgradeRoleError: undefined,
            upgradeRoleInProgress: undefined
        });
    case STOP_WAIT_FOR_OWNER:
        return assign(state, {
            waitForOwnerTimeoutID: undefined,
            upgradeRoleError: undefined
        });
    }

    return state;
});
