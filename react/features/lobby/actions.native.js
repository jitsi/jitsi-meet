// @flow

import { type Dispatch } from 'redux';

import { appNavigate } from '../app/actions';

export * from './actions.any';

/**
 * Cancels the ongoing knocking and abandons the join flow.
 *
 * @returns {Function}
 */
export function cancelKnocking() {
    return async (dispatch: Dispatch<any>) => {
        dispatch(appNavigate(undefined));
    };
}

