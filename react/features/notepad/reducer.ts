import { TOGGLE_NOTEPAD } from './actions';

export interface INotepadState {
    isOpen: boolean;
}

const initialState: INotepadState = {
    isOpen: false
};

export default function(state = initialState, action: any) {
    switch (action.type) {
        case TOGGLE_NOTEPAD:
            return {
                ...state,
                isOpen: !state.isOpen
            };

        default:
            return state;
    }
}
