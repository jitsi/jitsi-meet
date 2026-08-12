import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import {
    CLEAR_OWNER_LOCK,
    SET_CONTROLLER_SESSION,
    SET_FAR_END_CONTROL_OPT_IN,
    SET_LOCAL_PTZ_SUPPORT,
    SET_OWNER_LOCK,
    SET_OWNER_PENDING_REQUEST,
    SET_PARTICIPANT_PTZ_CAPABILITY
} from './actionTypes';
import { PTZControlState } from './constants';
import { IPTZCapabilities, PTZPermissionState } from './types';

const DEFAULT_STATE = {
    controller: {
        state: PTZControlState.IDLE
    },
    owner: {},
    participantCapabilities: {}
};

export interface ICameraPtzState {
    capabilities?: IPTZCapabilities;
    controller: {
        state: PTZControlState;
        target?: string;
        token?: number;
    };
    farEndControlOptIn?: boolean;
    owner: {
        heldBy?: string;
        leaseUntil?: number;
        pendingRequest?: string;
        token?: number;
    };
    participantCapabilities: { [participantId: string]: boolean; };
    permission?: PTZPermissionState;
}

ReducerRegistry.register<ICameraPtzState>(
    'features/camera-ptz', (state = DEFAULT_STATE, action): ICameraPtzState => {
        switch (action.type) {
        case SET_CONTROLLER_SESSION:
            return set(state, 'controller', {
                state: action.state,
                target: action.target,
                token: action.token
            });
        case SET_OWNER_LOCK:
            return {
                ...state,
                owner: {
                    heldBy: action.heldBy,
                    leaseUntil: action.leaseUntil,

                    // Granting the lock resolves the request that asked for it.
                    pendingRequest: undefined,
                    token: action.token
                }
            };
        case SET_FAR_END_CONTROL_OPT_IN:
            return set(state, 'farEndControlOptIn', action.optIn);
        case CLEAR_OWNER_LOCK:
            return {
                ...state,
                owner: {
                    pendingRequest: state.owner.pendingRequest
                }
            };
        case SET_OWNER_PENDING_REQUEST:
            return {
                ...state,
                owner: set(state.owner, 'pendingRequest', action.from)
            };
        case SET_PARTICIPANT_PTZ_CAPABILITY:
            return {
                ...state,
                participantCapabilities: set(state.participantCapabilities, action.participantId, action.capable)
            };
        case SET_LOCAL_PTZ_SUPPORT:
            return {
                ...state,
                capabilities: action.capabilities,
                permission: action.permission ?? state.permission
            };
        }

        return state;
    }
);
