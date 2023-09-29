import { SET_CAR_MODE } from './actionTypes';

export * from './actions.any';

/**
 * Creates a (redux) action which tells whether we are in carmode.
 *
 * @param {boolean} enabled - Whether we are in carmode.
 * @returns {{
 *     type: SET_CAR_MODE,
 *    enabled: boolean
 * }}
 */
export function setIsCarmode(enabled: boolean) {
    return {
        type: SET_CAR_MODE,
        enabled
    };
}
