/**
 * Updates the local participant's session as the controller of a remote camera.
 *
 * {
 *     type: SET_CONTROLLER_SESSION,
 *     state: PTZControlState,
 *     target?: string,
 *     token?: number
 * }
 */
export const SET_CONTROLLER_SESSION = 'SET_CONTROLLER_SESSION';

/**
 * Overrides the {@code offerFarEndCameraControl} configuration for this endpoint, letting an embedding application
 * offer or revoke its camera at runtime.
 *
 * {
 *     type: SET_FAR_END_CONTROL_OPT_IN,
 *     optIn: boolean
 * }
 */
export const SET_FAR_END_CONTROL_OPT_IN = 'SET_FAR_END_CONTROL_OPT_IN';

/**
 * Records where the camera under control is, as its owner reports it, and what it was last asked for while it is
 * still travelling.
 *
 * {
 *     type: SET_CONTROLLER_FRAMING,
 *     framing: { commanded?: IPTZValues, values?: IPTZValues }
 * }
 */
export const SET_CONTROLLER_FRAMING = 'SET_CONTROLLER_FRAMING';

/**
 * Records the remote participant holding the lock on the local camera until the lease expires.
 *
 * {
 *     type: SET_OWNER_LOCK,
 *     heldBy: string,
 *     leaseUntil: number,
 *     token: number
 * }
 */
export const SET_OWNER_LOCK = 'SET_OWNER_LOCK';

/**
 * {
 *     type: CLEAR_OWNER_LOCK
 * }
 */
export const CLEAR_OWNER_LOCK = 'CLEAR_OWNER_LOCK';

/**
 * Records a control request awaiting the local participant's approval, or clears it when {@code from} is undefined.
 *
 * {
 *     type: SET_OWNER_PENDING_REQUEST,
 *     from?: string
 * }
 */
export const SET_OWNER_PENDING_REQUEST = 'SET_OWNER_PENDING_REQUEST';

/**
 * Caches whether a participant advertised a controllable PTZ camera.
 *
 * {
 *     type: SET_PARTICIPANT_PTZ_CAPABILITY,
 *     capable: boolean,
 *     participantId: string
 * }
 */
export const SET_PARTICIPANT_PTZ_CAPABILITY = 'SET_PARTICIPANT_PTZ_CAPABILITY';

/**
 * Merges what is known about controlling the local camera, as the selected device, its capabilities or the
 * pan/tilt/zoom permission change.
 *
 * {
 *     type: UPDATE_LOCAL_PTZ_SUPPORT,
 *     support: ILocalPTZSupport
 * }
 */
export const UPDATE_LOCAL_PTZ_SUPPORT = 'UPDATE_LOCAL_PTZ_SUPPORT';
