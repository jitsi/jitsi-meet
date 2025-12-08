export const TOGGLE_NOTEPAD = 'TOGGLE_NOTEPAD';
export const SET_NOTEPAD_CONTENT = 'SET_NOTEPAD_CONTENT';
export const CLEAR_NOTEPAD = 'CLEAR_NOTEPAD';

export const toggleNotepad = () => ({
    type: TOGGLE_NOTEPAD
});

export const setNotepadContent = (text: string) => ({
    type: SET_NOTEPAD_CONTENT,
    payload: text
});

export const clearNotepad = () => ({
    type: CLEAR_NOTEPAD
});
