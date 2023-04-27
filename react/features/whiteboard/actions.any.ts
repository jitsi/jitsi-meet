import { IStore, IReduxState } from '../app/types';
import { setWhiteboardOpen } from './actions';
import { isWhiteboardOpen, isWhiteboardVisible, isWhiteboardAccessible } from './functions';


/**
 * API to toggle the whiteboard
 *
 * @param {Object} state - The redux state.
 * @returns {Function}
 */
export function toggleWhiteboard(state: IReduxState) {
    return async (dispatch: IStore['dispatch']) => {
        const isAccessible = isWhiteboardAccessible(state);
        const isOpen = isWhiteboardOpen(state);
  
        if (isAccessible) {
            if (isOpen && !isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(true));
  
            }
            else if (isOpen && isWhiteboardVisible(state)) {
                dispatch(setWhiteboardOpen(false));
  
            } else if (!isOpen) {
                dispatch(setWhiteboardOpen(true));
  
            }
        } 
    };
}