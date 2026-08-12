import { CameraControlAction, CameraControlDenyReason } from './constants';

/**
 * Mirrors the DOM {@code PermissionState}, which is not available in the native type definitions.
 */
export type PTZPermissionState = 'denied' | 'granted' | 'prompt';

export interface IPTZRange {
    max: number;
    min: number;
    step: number;
}

/**
 * The PTZ axes the local camera exposes; an absent axis is not controllable on that camera.
 */
export interface IPTZCapabilities {
    pan?: IPTZRange;
    tilt?: IPTZRange;
    zoom?: IPTZRange;
}

/**
 * Absolute pan/tilt/zoom values in the device independent {@link PAN_TILT_RANGE}/{@link ZOOM_RANGE} space.
 */
export interface IPTZValues {
    pan?: number;
    tilt?: number;
    zoom?: number;
}

/**
 * The payload of a {@link CAMERA_CONTROL_MESSAGE_NAME} endpoint message. The token identifies the grant a message
 * belongs to, so that messages from a superseded session can be dropped.
 */
export interface ICameraControlMessage {
    action: CameraControlAction;
    name: string;
    reason?: CameraControlDenyReason;
    token?: number;
    values?: IPTZValues;
}
