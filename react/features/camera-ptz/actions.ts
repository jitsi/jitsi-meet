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

/**
 * Updates the local participant's session as the controller of a remote camera.
 *
 * @param {PTZControlState} state - The new session state.
 * @param {string} target - The id of the participant whose camera is being controlled.
 * @param {number} token - The token identifying the grant.
 * @returns {Object}
 */
export function setControllerSession(state: PTZControlState, target?: string, token?: number) {
    return {
        type: SET_CONTROLLER_SESSION,
        state,
        target,
        token
    };
}

/**
 * Records the remote participant holding the lock on the local camera.
 *
 * @param {string} heldBy - The id of the participant holding the lock.
 * @param {number} token - The token identifying the grant.
 * @param {number} leaseUntil - The timestamp at which the lease expires.
 * @returns {Object}
 */
export function setOwnerLock(heldBy: string, token: number, leaseUntil: number) {
    return {
        type: SET_OWNER_LOCK,
        heldBy,
        leaseUntil,
        token
    };
}

/**
 * Clears the lock on the local camera.
 *
 * @returns {Object}
 */
export function clearOwnerLock() {
    return {
        type: CLEAR_OWNER_LOCK
    };
}

/**
 * Records or clears a control request awaiting the local participant's approval.
 *
 * @param {string} from - The id of the requesting participant, or undefined to clear the request.
 * @returns {Object}
 */
export function setOwnerPendingRequest(from?: string) {
    return {
        type: SET_OWNER_PENDING_REQUEST,
        from
    };
}

/**
 * Caches whether a participant advertised a controllable PTZ camera.
 *
 * @param {string} participantId - The id of the participant.
 * @param {boolean} capable - Whether the participant's camera is controllable.
 * @returns {Object}
 */
export function setParticipantPtzCapability(participantId: string, capable: boolean) {
    return {
        type: SET_PARTICIPANT_PTZ_CAPABILITY,
        capable,
        participantId
    };
}

/**
 * Stores the local camera's PTZ capabilities and the browser's PTZ permission state.
 *
 * @param {IPTZCapabilities} capabilities - The capabilities of the local camera.
 * @param {PTZPermissionState} permission - The browser's pan/tilt/zoom permission state.
 * @returns {Object}
 */
export function setLocalPtzSupport(capabilities?: IPTZCapabilities, permission?: PTZPermissionState) {
    return {
        type: SET_LOCAL_PTZ_SUPPORT,
        capabilities,
        permission
    };
}

/**
 * Overrides the configured far end control opt in for this endpoint.
 *
 * @param {boolean} optIn - Whether the camera is offered to remote participants.
 * @returns {Object}
 */
export function setFarEndControlOptIn(optIn: boolean) {
    return {
        type: SET_FAR_END_CONTROL_OPT_IN,
        optIn
    };
}
