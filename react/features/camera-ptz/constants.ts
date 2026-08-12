export const CAMERA_CONTROL_MESSAGE_NAME = 'camera-control';

export const CAMERA_PTZ_CAPABILITY_PROPERTY = 'ptzCameraControl';

/**
 * The camera owner is the sole authority for its own camera's lock: the controller sends
 * REQUEST/SET/KEEPALIVE/RELEASE, the owner replies GRANT/DENY/REVOKE.
 */
export enum CameraControlAction {
    DENY = 'deny',
    GRANT = 'grant',
    KEEPALIVE = 'keepalive',
    RELEASE = 'release',
    REQUEST = 'request',
    REVOKE = 'revoke',
    SET = 'set'
}

export enum CameraControlDenyReason {
    BUSY = 'busy',
    DENIED = 'denied',
    DISABLED = 'disabled'
}

export enum PTZControlState {
    CONTROLLED_BY_OTHER = 'controlledByOther',
    CONTROLLING = 'controlling',
    DENIED = 'denied',
    IDLE = 'idle',
    REQUESTED = 'requested',
    UNSUPPORTED = 'unsupported'
}

/**
 * How long (ms) a grant stays valid; refreshed by every SET and KEEPALIVE from the holder.
 */
export const CONTROL_LEASE_MS = 5000;

/**
 * How often (ms) the controller refreshes an idle lease.
 */
export const CONTROL_KEEPALIVE_INTERVAL_MS = 2000;

/**
 * How long (ms) a request waits for the owner's approval before it is auto-declined.
 */
export const CONTROL_REQUEST_TIMEOUT_MS = 30000;

/**
 * Device independent pan/tilt range used by the UI and on the wire; mapped to each camera's own range on apply.
 */
export const PAN_TILT_RANGE = {
    max: 1,
    min: -1
};

/**
 * Device independent zoom range used by the UI and on the wire; mapped to each camera's own range on apply.
 */
export const ZOOM_RANGE = {
    max: 4,
    min: 1
};
