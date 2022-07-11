import { batch } from 'react-redux';

import { appNavigate } from '../app/actions';

import { hideLobbyScreen, setKnockingState } from './actions.any';

export * from './actions.any';

/**
 * Cancels the ongoing knocking and abandons the join flow.
 *
 * @returns {Function}
 */
export function cancelKnocking() {
    return dispatch => {
        batch(() => {
            dispatch(setKnockingState(false));
            dispatch(hideLobbyScreen());
            dispatch(appNavigate(undefined));
        });
    };
}
