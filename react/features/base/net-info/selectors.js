import { STORE_NAME } from './constants';

/**
 * A selector for the internet online status.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean}
 */
export function isOnline(state) {
    return state[STORE_NAME].isOnline;
}
