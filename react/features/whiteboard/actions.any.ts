import { IReduxState, IStore } from '../app/types';

import { setWhiteboardOpen } from './actions';
import { isWhiteboardAllowed, isWhiteboardOpen, isWhiteboardVisible } from './functions';


/**
 * API to toggle the whiteboard.
 *
 * @param {Object} state - The redux state.
 * @returns {Function}
 */
export function toggleWhiteboard(state: IReduxState) {
    return async (dispatch: IStore['dispatch']) => {
        const isAllowed = isWhiteboardAllowed(state);
        const isOpen = isWhiteboardOpen(state);

        if (isAllowed) {
            if (isOpen && !isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(true));
            } else if (isOpen && isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(false));
            } else if (!isOpen) {
                dispatch(setWhiteboardOpen(true));
            }
        }
    };
}
