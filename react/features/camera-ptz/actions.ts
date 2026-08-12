import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';

import {
    CLEAR_OWNER_LOCK,
    SET_CONTROLLER_SESSION,
    SET_FAR_END_CONTROL_OPT_IN,
    SET_OWNER_LOCK,
    SET_OWNER_PENDING_REQUEST,
    SET_PARTICIPANT_PTZ_CAPABILITY,
    UPDATE_LOCAL_PTZ_SUPPORT
} from './actionTypes';
import {
    CONTROL_LEASE_MS,
    CONTROL_REQUEST_TIMEOUT_MS,
    CameraControlAction,
    CameraControlDenyReason,
    PTZControlState
} from './constants';
import {
    canControlRemoteCamera,
    getCameraPtzState,
    sendCameraControlMessage
} from './functions';
import logger from './logger';
import { CameraControlTimer, clearTimer, startTimeout } from './timers';
import { ILocalPTZSupport, IPTZValues } from './types';

let lastToken = 0;

/**
 * Returns the next grant token. Tokens only ever increase, so a message belonging to a superseded grant can be told
 * apart from a current one.
 *
 * @returns {number}
 */
function nextToken(): number {
    return ++lastToken;
}

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
 * Merges what is known about controlling the local camera.
 *
 * @param {ILocalPTZSupport} support - The fields to update.
 * @returns {Object}
 */
export function updateLocalPtzSupport(support: ILocalPTZSupport) {
    return {
        type: UPDATE_LOCAL_PTZ_SUPPORT,
        support
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

/**
 * Asks a participant for control of their camera. The owner answers with a grant or a denial, so this only moves the
 * session to requested and gives up if the answer never comes.
 *
 * @param {string} participantId - The participant whose camera to control.
 * @returns {Function}
 */
export function requestCameraControl(participantId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        if (!canControlRemoteCamera(state, participantId)) {
            return;
        }

        dispatch(releaseCameraControl());

        if (!sendCameraControlMessage(getCurrentConference(state), participantId,
                { action: CameraControlAction.REQUEST })) {
            return;
        }

        dispatch(setControllerSession(PTZControlState.REQUESTED, participantId));
        startTimeout(CameraControlTimer.REQUEST, CONTROL_REQUEST_TIMEOUT_MS, () => {
            logger.warn(`No answer to the camera control request sent to ${participantId}`);
            dispatch(setControllerSession(PTZControlState.IDLE));
        });
    };
}

/**
 * Drives the camera currently under control, and keeps the lease alive by doing so.
 *
 * @param {IPTZValues} values - The absolute values to move to.
 * @returns {Function}
 */
export function sendCameraControl(values: IPTZValues) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { state: sessionState, target, token } = getCameraPtzState(state).controller;

        if (sessionState !== PTZControlState.CONTROLLING) {
            return;
        }

        sendCameraControlMessage(getCurrentConference(state), target, {
            action: CameraControlAction.SET,
            token,
            values
        });
    };
}

/**
 * Hands back control of the camera being controlled, if any.
 *
 * @returns {Function}
 */
export function releaseCameraControl() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { target, token } = getCameraPtzState(state).controller;

        clearTimer(CameraControlTimer.KEEPALIVE);
        clearTimer(CameraControlTimer.REQUEST);

        if (target) {
            sendCameraControlMessage(getCurrentConference(state), target, {
                action: CameraControlAction.RELEASE,
                token
            });
        }

        dispatch(setControllerSession(PTZControlState.IDLE));
    };
}

/**
 * Grants the participant waiting for approval control of the local camera, under a fresh token and lease.
 *
 * @returns {Function}
 */
export function approveCameraControlRequest() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { pendingRequest } = getCameraPtzState(getState()).owner;

        pendingRequest && dispatch(grantCameraControl(pendingRequest));
    };
}

/**
 * Refuses the participant waiting for approval, or the given one.
 *
 * @param {CameraControlDenyReason} reason - Why the request is refused.
 * @param {string} participantId - The participant to refuse, defaulting to the one awaiting approval.
 * @returns {Function}
 */
export function denyCameraControlRequest(
        reason: CameraControlDenyReason = CameraControlDenyReason.DENIED,
        participantId?: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { pendingRequest } = getCameraPtzState(state).owner;
        const to = participantId ?? pendingRequest;

        sendCameraControlMessage(getCurrentConference(state), to, {
            action: CameraControlAction.DENY,
            reason
        });

        to === pendingRequest && dispatch(setOwnerPendingRequest());
    };
}

/**
 * Gives a participant control of the local camera under a fresh token, and starts the lease that every SET and
 * KEEPALIVE from them refreshes. The lock is only recorded once the grant is on its way, so a grant that could not
 * be sent does not leave the camera reserved for a participant that never heard about it.
 *
 * @param {string} participantId - The participant to hand control to.
 * @returns {Function}
 */
export function grantCameraControl(participantId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const token = nextToken();

        if (!sendCameraControlMessage(getCurrentConference(getState()), participantId, {
            action: CameraControlAction.GRANT,
            token
        })) {
            logger.warn(`Could not grant camera control to ${participantId}`);
            dispatch(setOwnerPendingRequest());

            return;
        }

        logger.info(`Camera control granted to ${participantId} under token ${token}`);
        dispatch(setOwnerLock(participantId, token, Date.now() + CONTROL_LEASE_MS));
        dispatch(startOwnerLeaseTimer());
    };
}

/**
 * Refreshes the lease of the participant holding the local camera.
 *
 * @returns {Function}
 */
export function refreshOwnerLease() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { heldBy, token } = getCameraPtzState(getState()).owner;

        if (!heldBy || token === undefined) {
            return;
        }

        dispatch(setOwnerLock(heldBy, token, Date.now() + CONTROL_LEASE_MS));
        dispatch(startOwnerLeaseTimer());
    };
}

/**
 * Takes control of the local camera back, telling whoever holds it that they no longer do.
 *
 * @param {CameraControlDenyReason} reason - Why control is being taken back.
 * @returns {Function}
 */
export function revokeCameraControl(reason: CameraControlDenyReason = CameraControlDenyReason.DENIED) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { heldBy, token } = getCameraPtzState(state).owner;

        clearTimer(CameraControlTimer.LEASE);

        if (!heldBy) {
            return;
        }

        logger.info(`Camera control revoked from ${heldBy}: ${reason}`);
        sendCameraControlMessage(getCurrentConference(state), heldBy, {
            action: CameraControlAction.REVOKE,
            reason,
            token
        });
        dispatch(clearOwnerLock());
    };
}

/**
 * Refreshes the lease on the camera under control without moving it.
 *
 * @param {string} participantId - The owner of the camera.
 * @param {number} token - The token the session was granted under.
 * @returns {Function}
 */
export function sendCameraControlKeepalive(participantId: string, token?: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        sendCameraControlMessage(getCurrentConference(getState()), participantId, {
            action: CameraControlAction.KEEPALIVE,
            token
        });
    };
}

/**
 * Arms the timer that takes control back from a holder that stopped refreshing its lease, which is what happens when
 * the controlling endpoint goes away without releasing.
 *
 * @returns {Function}
 */
function startOwnerLeaseTimer() {
    return (dispatch: IStore['dispatch']) => {
        startTimeout(CameraControlTimer.LEASE, CONTROL_LEASE_MS, () => {
            logger.info('Camera control lease expired');
            dispatch(revokeCameraControl());
        });
    };
}
