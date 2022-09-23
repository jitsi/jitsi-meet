import { IState } from '../../app/types';

import { STORE_NAME } from './constants';

/**
 * A selector for the internet online status.
 *
 * @param {IState} state - The redux state.
 * @returns {boolean}
 */
export function isOnline(state: IState) {
    return state[STORE_NAME].isOnline;
}
