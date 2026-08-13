import { IStore } from '../app/types';
import { CONFERENCE_JOINED, ENDPOINT_MESSAGE_RECEIVED } from '../base/conference/actionTypes';
import { IJitsiConference } from '../base/conference/reducer';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import { IJitsiParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import {
    clearOwnerLock,
    denyCameraControlRequest,
    refreshOwnerLease,
    releaseCameraControl,
    revokeCameraControl,
    sendCameraControlKeepalive,
    setControllerSession,
    setOwnerPendingRequest,
    setParticipantPtzCapability
} from './actions';
import {
    CAMERA_CONTROL_MESSAGE_NAME,
    CAMERA_PTZ_CAPABILITY_PROPERTY,
    CONTROL_KEEPALIVE_INTERVAL_MS,
    CONTROL_REQUEST_TIMEOUT_MS,
    CameraControlAction,
    CameraControlDenyReason,
    PTZControlState
} from './constants';
import {
    getCameraPtzState,
    getLocalCameraTrack,
    isLocalCameraOfferedForFarEndControl,
    isOwnerLeaseValid,
    sanitizePtzValues,
    toDeviceValues
} from './functions';
import logger from './logger';
import { CameraControlTimer, clearTimer, startInterval, startTimeout } from './timers';
import { ICameraControlMessage } from './types';

import './subscriber';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED:
        _watchPtzCameraAdvertisements(store, action.conference);
        break;
    case ENDPOINT_MESSAGE_RECEIVED:
        _onEndpointMessage(store, action.participant?.getId(), action.data);
        break;
    case PARTICIPANT_LEFT:
        _onParticipantLeft(store, action.participant.id);
        break;
    }

    return next(action);
});

/**
 * Values arrive in a device independent range, so they are mapped onto what this camera accepts before being applied.
 * The ranges are only known once the pan/tilt/zoom permission has been granted.
 *
 * @param {IStore} store - The redux store.
 * @param {ICameraControlMessage} message - The message asking for the move.
 * @returns {void}
 */
function _applyCameraControl({ getState }: IStore, message: ICameraControlMessage) {
    const state = getState();
    const { capabilities } = getCameraPtzState(state).local;
    const track = getLocalCameraTrack(state);

    if (!track) {
        return;
    }

    if (!capabilities) {
        logger.warn('Cannot move the camera, its pan/tilt/zoom ranges are not known');

        return;
    }

    const values = toDeviceValues(sanitizePtzValues(message.values), capabilities);

    if (!Object.keys(values).length) {
        logger.warn('Nothing to apply to the camera, no requested axis is driveable on it');

        return;
    }

    track.setCameraControl(values)
        .catch((error: Error) => logger.warn('The camera rejected the pan/tilt/zoom values', error));
}

/**
 * The action decides which side of the protocol this endpoint is on for a given message: the owner of the camera
 * being controlled, or the participant controlling someone else's.
 *
 * @param {IStore} store - The redux store.
 * @param {string} from - The participant the message came from.
 * @param {Object} data - The data carried by the endpoint message.
 * @returns {void}
 */
function _onEndpointMessage(store: IStore, from: string | undefined, data?: ICameraControlMessage) {
    if (!from || data?.name !== CAMERA_CONTROL_MESSAGE_NAME) {
        return;
    }

    switch (data.action) {
    case CameraControlAction.REQUEST:
    case CameraControlAction.SET:
    case CameraControlAction.KEEPALIVE:
    case CameraControlAction.RELEASE:
        _onOwnerMessage(store, from, data);
        break;
    case CameraControlAction.GRANT:
    case CameraControlAction.DENY:
    case CameraControlAction.REVOKE:
        _onControllerMessage(store, from, data);
        break;
    }
}

/**
 * Answers are only taken from the participant this endpoint actually asked, so that a stray grant cannot start a
 * session nobody asked for.
 *
 * @param {IStore} store - The redux store.
 * @param {string} from - The owner of the camera.
 * @param {ICameraControlMessage} message - The answer.
 * @returns {void}
 */
function _onControllerMessage(store: IStore, from: string, message: ICameraControlMessage) {
    const { dispatch, getState } = store;
    const { target } = getCameraPtzState(getState()).controller;

    if (from !== target) {
        return;
    }

    clearTimer(CameraControlTimer.REQUEST);

    switch (message.action) {
    case CameraControlAction.GRANT:
        logger.info(`Granted control of the camera of ${from} under token ${message.token}`);
        dispatch(setControllerSession(PTZControlState.CONTROLLING, from, message.token));
        startInterval(CameraControlTimer.KEEPALIVE, CONTROL_KEEPALIVE_INTERVAL_MS, () => _onKeepalive(store));
        break;
    case CameraControlAction.DENY:
        logger.info(`Control of the camera of ${from} was denied: ${message.reason}`);
        dispatch(setControllerSession(_deniedState(message.reason), from));
        break;
    case CameraControlAction.REVOKE:
        logger.info(`Control of the camera of ${from} was taken back: ${message.reason}`);
        clearTimer(CameraControlTimer.KEEPALIVE);
        dispatch(setControllerSession(PTZControlState.IDLE));
        break;
    }
}

/**
 * The lock on the local camera is held by at most one participant at a time, under a token and a lease. Only the
 * holder of the current token can move the camera, which is what makes a message from a superseded session harmless.
 *
 * @param {IStore} store - The redux store.
 * @param {string} from - The participant the message came from.
 * @param {ICameraControlMessage} message - The message.
 * @returns {void}
 */
function _onOwnerMessage(store: IStore, from: string, message: ICameraControlMessage) {
    const { dispatch, getState } = store;
    const state = getState();
    const { heldBy, pendingRequest, token } = getCameraPtzState(state).owner;
    const held = isOwnerLeaseValid(state, Date.now());
    const isHolder = held && heldBy === from && message.token === token;

    switch (message.action) {
    case CameraControlAction.REQUEST:
        if (!isLocalCameraOfferedForFarEndControl(state)) {
            dispatch(denyCameraControlRequest(CameraControlDenyReason.DISABLED, from));
        } else if ((held && heldBy !== from) || (pendingRequest && pendingRequest !== from)) {
            dispatch(denyCameraControlRequest(CameraControlDenyReason.BUSY, from));
        } else {
            logger.info(`Camera control requested by ${from}`);
            dispatch(setOwnerPendingRequest(from));
            _startApprovalTimeout(store, from);
        }
        break;
    case CameraControlAction.SET:
        if (isHolder) {
            _applyCameraControl(store, message);
            dispatch(refreshOwnerLease());
        }
        break;
    case CameraControlAction.KEEPALIVE:
        isHolder && dispatch(refreshOwnerLease());
        break;
    case CameraControlAction.RELEASE:
        if (held && heldBy === from) {
            logger.info(`Camera control released by ${from}`);
            clearTimer(CameraControlTimer.LEASE);
            dispatch(clearOwnerLock());
        }
        break;
    }
}

/**
 * Neither side will hear from a participant that left again, so any session they were part of ends here rather than
 * waiting for a lease to run out.
 *
 * @param {IStore} store - The redux store.
 * @param {string} participantId - The participant that left.
 * @returns {void}
 */
function _onParticipantLeft(store: IStore, participantId: string) {
    const { dispatch, getState } = store;
    const { controller, owner } = getCameraPtzState(getState());

    dispatch(setParticipantPtzCapability(participantId, false));

    if (owner.heldBy === participantId) {
        dispatch(revokeCameraControl());
    }

    if (owner.pendingRequest === participantId) {
        clearTimer(CameraControlTimer.APPROVAL);
        dispatch(setOwnerPendingRequest());
    }

    controller.target === participantId && dispatch(releaseCameraControl());
}

/**
 * Refreshes the lease while the camera is under control but is not being moved, and stops once the session is over.
 *
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
function _onKeepalive({ dispatch, getState }: IStore) {
    const { state, target, token } = getCameraPtzState(getState()).controller;

    if (state !== PTZControlState.CONTROLLING || !target) {
        clearTimer(CameraControlTimer.KEEPALIVE);

        return;
    }

    dispatch(sendCameraControlKeepalive(target, token));
}

/**
 * A request the local participant never answered is refused, so that the asking side is not left waiting and the
 * camera does not stay reserved for them.
 *
 * @param {IStore} store - The redux store.
 * @param {string} from - The participant that asked.
 * @returns {void}
 */
function _startApprovalTimeout({ dispatch, getState }: IStore, from: string) {
    startTimeout(CameraControlTimer.APPROVAL, CONTROL_REQUEST_TIMEOUT_MS, () => {
        if (getCameraPtzState(getState()).owner.pendingRequest === from) {
            logger.info(`Camera control request from ${from} was not answered`);
            dispatch(denyCameraControlRequest(CameraControlDenyReason.DENIED, from));
        }
    });
}

/**
 * Covers the participants already in the conference as well as the ones that start or stop offering their camera
 * later, so the control affordance can be shown without touching anyone's stream.
 *
 * @param {IStore} store - The redux store.
 * @param {IJitsiConference} conference - The conference that was joined.
 * @returns {void}
 */
function _watchPtzCameraAdvertisements(store: IStore, conference: IJitsiConference) {
    const update = (participant: IJitsiParticipant, value: unknown) =>
        store.dispatch(setParticipantPtzCapability(participant.getId(), String(value) === 'true'));

    conference.getParticipants().forEach((participant: IJitsiParticipant) => {
        const value = participant.getProperty(CAMERA_PTZ_CAPABILITY_PROPERTY);

        value === undefined || update(participant, value);
    });

    conference.on(
        JitsiConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,
        (participant: IJitsiParticipant, propertyName: string, _oldValue: unknown, newValue: unknown) => {
            propertyName === CAMERA_PTZ_CAPABILITY_PROPERTY && update(participant, newValue);
        });
}

/**
 * Being refused because the camera is busy or the feature is off is not the same as being turned down, and the UI
 * shows each differently.
 *
 * @param {CameraControlDenyReason} reason - Why the request was refused.
 * @returns {PTZControlState}
 */
function _deniedState(reason?: CameraControlDenyReason): PTZControlState {
    switch (reason) {
    case CameraControlDenyReason.BUSY:
        return PTZControlState.CONTROLLED_BY_OTHER;
    case CameraControlDenyReason.DISABLED:
        return PTZControlState.UNSUPPORTED;
    default:
        return PTZControlState.DENIED;
    }
}
