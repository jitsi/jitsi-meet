import { IStore } from '../app/types';

import { SET_CODE_EDITOR_OPEN } from './actionTypes';

/**
 * Sets whether the collaborative code editor is open.
 *
 * @param {boolean} isOpen - Whether the editor should be open.
 * @param {boolean} userInitiated - True when a local click triggered this (so
 * the middleware broadcasts it); false when applying a remote change.
 * @returns {Object}
 */
export function setCodeEditorOpen(isOpen: boolean, userInitiated = true) {
    return {
        type: SET_CODE_EDITOR_OPEN,
        isOpen,
        userInitiated
    };
}

/**
 * Toggles the collaborative code editor open/closed.
 *
 * @returns {Function}
 */
export function toggleCodeEditor() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { isOpen } = getState()['features/code-editor'];

        dispatch(setCodeEditorOpen(!isOpen, true));
    };
}
