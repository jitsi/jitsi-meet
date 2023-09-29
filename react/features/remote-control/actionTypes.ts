/**
 * The type of (redux) action which signals that the controller is capturing mouse and keyboard events.
 *
 * {
 *     type: CAPTURE_EVENTS,
 *     isCapturingEvents: boolean
 * }
 */
export const CAPTURE_EVENTS = 'CAPTURE_EVENTS';

/**
 * The type of (redux) action which signals that a remote control active state has changed.
 *
 * {
 *     type: REMOTE_CONTROL_ACTIVE,
 *     active: boolean
 * }
 */
export const REMOTE_CONTROL_ACTIVE = 'REMOTE_CONTROL_ACTIVE';

/**
 * The type of (redux) action which sets the receiver transport object.
 *
 * {
 *     type: SET_RECEIVER_TRANSPORT,
 *     transport: Transport
 * }
 */
export const SET_RECEIVER_TRANSPORT = 'SET_RECEIVER_TRANSPORT';

/**
 * The type of (redux) action which enables the receiver.
 *
 * {
 *     type: SET_RECEIVER_ENABLED,
 *     enabled: boolean
 * }
 */
export const SET_RECEIVER_ENABLED = 'SET_RECEIVER_ENABLED';

/**
 * The type of (redux) action which sets the controller participant on the receiver side.
 * {
 *     type: SET_CONTROLLER,
 *     controller: string
 * }
 */
export const SET_CONTROLLER = 'SET_CONTROLLER';

/**
 * The type of (redux) action which sets the controlled participant on the controller side.
 * {
 *     type: SET_CONTROLLED_PARTICIPANT,
 *     controlled: string
 * }
 */
export const SET_CONTROLLED_PARTICIPANT = 'SET_CONTROLLED_PARTICIPANT';


/**
 * The type of (redux) action which sets the requested participant on the controller side.
 * {
 *     type: SET_REQUESTED_PARTICIPANT,
 *     requestedParticipant: string
 * }
 */
export const SET_REQUESTED_PARTICIPANT = 'SET_REQUESTED_PARTICIPANT';

