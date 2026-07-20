import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_CODE_EDITOR_OPEN } from './actionTypes';

/**
 * The redux state of the collaborative code editor.
 */
export interface ICodeEditorState {

    /**
     * Whether the editor overlay is currently open.
     */
    isOpen: boolean;
}

const DEFAULT_STATE: ICodeEditorState = {
    isOpen: false
};

ReducerRegistry.register<ICodeEditorState>(
    'features/code-editor',
    (state = DEFAULT_STATE, action): ICodeEditorState => {
        switch (action.type) {
        case SET_CODE_EDITOR_OPEN:
            return {
                ...state,
                isOpen: Boolean(action.isOpen)
            };
        default:
            return state;
        }
    }
);
