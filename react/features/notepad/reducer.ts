import { TOGGLE_NOTEPAD, SET_NOTEPAD_CONTENT, CLEAR_NOTEPAD } from './actions';

export interface INotepadState {
    isOpen: boolean;
    content: string;
}

const initialState: INotepadState = {
    isOpen: false,
    content: ''
};

export default function(state = initialState, action: any) {
    switch (action.type) {

        case TOGGLE_NOTEPAD:
            return {
                ...state,
                isOpen: !state.isOpen
            };

        case SET_NOTEPAD_CONTENT:
            return {
                ...state,
                content: action.payload
            };

        case CLEAR_NOTEPAD:
            return {
                ...state,
                content: ''
            };

        default:
            return state;
    }
}
