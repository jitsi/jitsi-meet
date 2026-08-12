import { IReduxState } from '../app/types';
import { isMobileBrowser } from '../base/environment/utils';

import { PTZControlState } from './constants';
import { ICameraPtzState } from './reducer';
import { IPTZRange } from './types';

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
 * Whether the local camera exposes at least one controllable axis and the browser has not denied PTZ access. Local
 * controls are not offered on mobile browsers, where the pan/tilt/zoom constraints are unsupported or zoom only.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isLocalPtzControllable(state: IReduxState): boolean {
    const { capabilities, permission } = getCameraPtzState(state);

    return isCameraPtzEnabled(state)
        && !isMobileBrowser()
        && permission !== 'denied'
        && Object.keys(capabilities ?? {}).length > 0;
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
        && (farEndControlOptIn ?? Boolean(state['features/base/config'].offerFarEndCameraControl));
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
