import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { MEDIA_TYPE } from '../base/media/constants';
import { replaceLocalTrack } from '../base/tracks/actions';
import { createLocalTracksF } from '../base/tracks/functions';

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
    PTZControlState,
    ZOOM_RANGE
} from './constants';
import {
    canControlRemoteCamera,
    fromDeviceValues,
    getCameraPtzState,
    getLocalCameraTrack,
    sanitizePtzValues,
    sendCameraControlMessage,
    toDeviceValues
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

        if (to === pendingRequest) {
            clearTimer(CameraControlTimer.APPROVAL);
            dispatch(setOwnerPendingRequest());
        }
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
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        // The local participant has answered, so the timeout that would refuse for them must not fire while the
        // browser is asking them for the pan/tilt/zoom permission.
        clearTimer(CameraControlTimer.APPROVAL);

        // Nobody can move the camera until it has been acquired with the pan/tilt/zoom constraints, which is what
        // asks the local participant for the second permission.
        if (!await dispatch(acquireCameraPtzCapabilities())) {
            dispatch(denyCameraControlRequest(CameraControlDenyReason.DISABLED, participantId));

            return;
        }

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
 * Acquires the camera with the pan/tilt/zoom constraints, which is what asks the local participant for the
 * pan/tilt/zoom permission and is the only way a browser exposes the ranges the camera accepts. The same camera is
 * kept, so the replacement is invisible to the conference beyond a brief re-acquire.
 *
 * The axes are taken from the ranges the acquired track reports, which is authoritative where the earlier device
 * probe was only a hint.
 *
 * @returns {Function} Resolves with the ranges, or undefined when the camera cannot be driven.
 */
export function acquireCameraPtzCapabilities() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { capabilities } = getCameraPtzState(getState()).local;

        // A refused permission leaves an empty set of ranges behind, which must not read as a camera that can be
        // driven, or a later grant would succeed and then move nothing.
        if (capabilities && Object.keys(capabilities).length) {
            return capabilities;
        }

        const oldTrack = getLocalCameraTrack(getState());

        if (!oldTrack) {
            return undefined;
        }

        let newTrack;

        try {
            [ newTrack ] = await createLocalTracksF({
                cameraDeviceId: oldTrack.getDeviceId(),
                cameraPtz: true,
                devices: [ MEDIA_TYPE.VIDEO ]
            }, { dispatch,
                getState });

            await dispatch(replaceLocalTrack(oldTrack, newTrack));
        } catch (error) {
            logger.error('Could not acquire the camera with pan/tilt/zoom', error);
            newTrack?.dispose();

            return undefined;
        }

        const ranges = newTrack.getCameraControlCapabilities();
        const driveable = Boolean(ranges.pan || ranges.tilt || ranges.zoom);

        dispatch(updateLocalPtzSupport({
            axes: {
                pan: Boolean(ranges.pan),
                tilt: Boolean(ranges.tilt),
                zoom: Boolean(ranges.zoom)
            },
            capabilities: ranges,
            permission: driveable ? 'granted' : 'denied',
            values: fromDeviceValues(newTrack.getCameraControlSettings(), ranges)
        }));

        if (!driveable) {
            logger.warn('The camera was acquired without pan/tilt/zoom, the permission was refused');

            return undefined;
        }

        return ranges;
    };
}

/**
 * Drives the local camera. Taking hold of it locally ends a remote session, since the two would otherwise fight over
 * the same camera, and the local participant owns it.
 *
 * The target is held as commanded until the camera reports it has arrived, which is what lets the UI show where the
 * camera is going while it is still travelling.
 *
 * @param {IPTZValues} values - The absolute values to move to, in the device independent range.
 * @returns {Function}
 */
export function setLocalCameraControl(values: IPTZValues) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const ranges = await dispatch(acquireCameraPtzCapabilities());

        if (!ranges) {
            return;
        }

        if (getCameraPtzState(getState()).owner.heldBy) {
            dispatch(revokeCameraControl());
        }

        const track = getLocalCameraTrack(getState());
        const commanded = sanitizePtzValues(values);

        if (!track || !Object.keys(commanded).length) {
            return;
        }

        dispatch(updateLocalPtzSupport({ commanded }));

        try {
            await track.setCameraControl(toDeviceValues(commanded, ranges));
            dispatch(updateLocalPtzSupport({
                commanded: undefined,
                values: fromDeviceValues(track.getCameraControlSettings(), ranges)
            }));
        } catch (error) {
            logger.warn('The camera rejected the pan/tilt/zoom values', error);
            dispatch(updateLocalPtzSupport({ commanded: undefined }));
        }
    };
}

/**
 * Returns the local camera to the middle of its range, fully zoomed out.
 *
 * @returns {Function}
 */
export function resetLocalCameraFraming() {
    return setLocalCameraControl({
        pan: 0,
        tilt: 0,
        zoom: ZOOM_RANGE.min
    });
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
