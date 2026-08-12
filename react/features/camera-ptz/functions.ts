import { IReduxState } from '../app/types';
import { IJitsiConference } from '../base/conference/reducer';
import { isMobileBrowser } from '../base/environment/utils';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media/constants';

import {
    CAMERA_CONTROL_MESSAGE_NAME,
    PAN_TILT_RANGE,
    PTZControlState,
    PTZ_AXES,
    ZOOM_RANGE
} from './constants';
import logger from './logger';
import { ICameraPtzState } from './reducer';
import { ICameraControlMessage, IPTZCapabilities, IPTZRange, IPTZValues } from './types';

/**
 * Returns the camera PTZ state.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {ICameraPtzState}
 */
export function getCameraPtzState(state: IReduxState): ICameraPtzState {
    return state['features/camera-ptz'];
}

/**
 * Whether the camera PTZ feature is enabled by configuration.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCameraPtzEnabled(state: IReduxState): boolean {
    return !state['features/base/config'].disableCameraPtz;
}

/**
 * Returns the local camera track, which is the one pan/tilt/zoom applies to even while an effect such as a virtual
 * background is replacing the track sent to the conference.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object|undefined}
 */
export function getLocalCameraTrack(state: IReduxState) {
    return state['features/base/tracks'].find(track => track.local
        && track.mediaType === MEDIA_TYPE.VIDEO
        && track.videoType === VIDEO_TYPE.CAMERA)?.jitsiTrack;
}

/**
 * Whether the selected camera can be driven at all: it reports at least one axis and the pan/tilt/zoom permission
 * has not been denied. Nothing may claim a camera is controllable without this.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function hasControllableLocalCamera(state: IReduxState): boolean {
    const { axes, permission } = getCameraPtzState(state).local;

    return permission !== 'denied' && Boolean(axes && (axes.pan || axes.tilt || axes.zoom));
}

/**
 * Whether to offer pan/tilt/zoom controls for the local camera. Not on mobile browsers, where the constraints are
 * either unsupported or zoom only.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isLocalPtzControllable(state: IReduxState): boolean {
    return isCameraPtzEnabled(state) && !isMobileBrowser() && hasControllableLocalCamera(state);
}

/**
 * Whether far end camera control is rolled out to this deployment. On its own this makes no camera controllable.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isFarEndCameraControlPermitted(state: IReduxState): boolean {
    return isCameraPtzEnabled(state) && Boolean(state['features/base/config'].enableFarEndCameraControl);
}

/**
 * Whether this endpoint offers its camera to remote participants. Rolling the feature out is not enough, the
 * endpoint has to opt in as well, either through configuration or, for an embedding application, at runtime.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isLocalCameraOfferedForFarEndControl(state: IReduxState): boolean {
    const { farEndControlOptIn } = getCameraPtzState(state);

    return isFarEndCameraControlPermitted(state)
        && (farEndControlOptIn ?? Boolean(state['features/base/config'].offerFarEndCameraControl))
        && hasControllableLocalCamera(state);
}

/**
 * Whether a participant advertised a controllable PTZ camera.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The id of the participant.
 * @returns {boolean}
 */
export function hasPtzCamera(state: IReduxState, participantId: string): boolean {
    return Boolean(getCameraPtzState(state).participantCapabilities[participantId]);
}

/**
 * Whether the local participant may control a remote participant's camera. Controlling needs no local opt in, only
 * an advertisement from the participant being controlled.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The id of the participant.
 * @returns {boolean}
 */
export function canControlRemoteCamera(state: IReduxState, participantId: string): boolean {
    return isFarEndCameraControlPermitted(state) && hasPtzCamera(state, participantId);
}

/**
 * Returns the control state to render for a remote participant's camera.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The id of the participant.
 * @returns {PTZControlState}
 */
export function getPtzControlState(state: IReduxState, participantId: string): PTZControlState {
    if (!canControlRemoteCamera(state, participantId)) {
        return PTZControlState.UNSUPPORTED;
    }

    const { controller } = getCameraPtzState(state);

    return controller.target === participantId ? controller.state : PTZControlState.IDLE;
}

/**
 * Whether the lease on the local camera is still valid at the given time.
 *
 * @param {IReduxState} state - The redux state.
 * @param {number} now - The time to check the lease against.
 * @returns {boolean}
 */
export function isOwnerLeaseValid(state: IReduxState, now: number): boolean {
    const { heldBy, leaseUntil } = getCameraPtzState(state).owner;

    return Boolean(heldBy) && (leaseUntil ?? 0) > now;
}

/**
 * Sends a camera control message to a single participant over the bridge channel.
 *
 * @param {IJitsiConference} conference - The conference to send on.
 * @param {string} to - The participant to send to.
 * @param {ICameraControlMessage} message - The message to send.
 * @returns {boolean} Whether the message was handed off for sending.
 */
export function sendCameraControlMessage(
        conference: IJitsiConference | undefined,
        to: string | undefined,
        message: Omit<ICameraControlMessage, 'name'>): boolean {
    if (!conference || !to) {
        return false;
    }

    try {
        conference.sendEndpointMessage(to, {
            name: CAMERA_CONTROL_MESSAGE_NAME,
            ...message
        });

        return true;
    } catch (error) {
        // Sending fails while there is no bridge channel, which is the case in a peer to peer call.
        logger.error('Failed to send a camera control message', error);

        return false;
    }
}

/**
 * Keeps the pan/tilt/zoom values that are finite numbers, so that what a remote participant sent cannot be handed to
 * the camera unchecked.
 *
 * @param {IPTZValues} values - The values to sanitise.
 * @returns {IPTZValues}
 */
export function sanitizePtzValues(values?: IPTZValues): IPTZValues {
    const sanitized: IPTZValues = {};

    PTZ_AXES.forEach(axis => {
        const value = values?.[axis];

        if (typeof value === 'number' && Number.isFinite(value)) {
            sanitized[axis] = value;
        }
    });

    return sanitized;
}

/**
 * Maps device independent pan/tilt/zoom values onto the ranges the camera actually accepts. An axis the camera does
 * not expose is dropped.
 *
 * @param {IPTZValues} values - The values to map.
 * @param {IPTZCapabilities} capabilities - The ranges the camera reports.
 * @returns {IPTZValues}
 */
export function toDeviceValues(values: IPTZValues, capabilities: IPTZCapabilities): IPTZValues {
    const mapped: IPTZValues = {};

    PTZ_AXES.forEach(axis => {
        const value = values[axis];
        const range = capabilities[axis];

        if (value !== undefined && range) {
            mapped[axis] = scaleValue(value, axis === 'zoom' ? ZOOM_RANGE : PAN_TILT_RANGE, range);
        }
    });

    return mapped;
}

/**
 * Maps a value from one range onto another, clamped to the target range and snapped to its step.
 *
 * @param {number} value - The value to map.
 * @param {Object} from - The range the value is expressed in.
 * @param {IPTZRange} to - The range to map the value onto.
 * @returns {number}
 */
export function scaleValue(value: number, from: { max: number; min: number; }, to: IPTZRange): number {
    const ratio = from.max === from.min ? 0 : (value - from.min) / (from.max - from.min);
    const scaled = to.min + (Math.min(Math.max(ratio, 0), 1) * (to.max - to.min));

    if (!to.step) {
        return scaled;
    }

    return Math.min(to.max, to.min + (Math.round((scaled - to.min) / to.step) * to.step));
}
