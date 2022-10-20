import { IReduxState } from '../../app/types';

import { STORE_NAME } from './constants';

/**
 * A selector for the internet online status.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isOnline(state: IReduxState) {
    return state[STORE_NAME].isOnline;
}
