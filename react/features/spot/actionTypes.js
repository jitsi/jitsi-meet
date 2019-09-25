// @flow

/**
 * Action type to be dispatched when new spot devices are detected.
 *
 * {
 *     devices: Array<Object>,
 *     type: SPOT_DEVICES_DETECTED
 * }
 */
export const SPOT_DEVICES_DETECTED = 'SPOT_DEVICES_DETECTED';

/**
 * Action type to be dispatched to toggle the spot controller view.
 *
 * {
 *     device: ?Object,
 *     show: boolean,
 *     type: TOGGLE_SPOT_CONTROLLER_VIEW
 * }
 */
export const TOGGLE_SPOT_CONTROLLER_VIEW = 'TOGGLE_SPOT_CONTROLLER_VIEW';

/**
 * Action type to be dispatched to toggle the spot devices list screen.
 *
 * {
 *     show:  boolean,
 *     type: TOGGLE_SPOT_SCREEN
 * }
 */
export const TOGGLE_SPOT_DEVICES_LIST = 'TOGGLE_SPOT_DEVICES_LIST';
