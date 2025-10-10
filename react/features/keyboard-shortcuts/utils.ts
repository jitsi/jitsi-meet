/**
 * Prefer keyboard handling of these elements over global shortcuts.
 * If a button is triggered using the Spacebar it should not trigger PTT.
 * If an input element is focused and M is pressed it should not mute audio.
 */
const _elementsBlacklist = [
    'input',
    'textarea',
    'button',
    '[role=button]',
    '[role=menuitem]',
    '[role=radio]',
    '[role=tab]',
    '[role=option]',
    '[role=switch]',
    '[role=range]',
    '[role=log]'
];

const codeMap = new Map<string, string>([
    [ 'Backquote', 'Backquote' ],
    [ 'Digit1', '1' ],
    [ 'Digit2', '2' ],
    [ 'Digit3', '3' ],
    [ 'Digit4', '4' ],
    [ 'Digit5', '5' ],
    [ 'Digit6', '6' ],
    [ 'Digit7', '7' ],
    [ 'Digit8', '8' ],
    [ 'Digit9', '9' ],
    [ 'Digit0', '0' ],
    [ 'Minus', 'Minus' ],
    [ 'Equal', 'Equal' ],
    [ 'KeyQ', 'Q' ],
    [ 'KeyW', 'W' ],
    [ 'KeyE', 'E' ],
    [ 'KeyR', 'R' ],
    [ 'KeyT', 'T' ],
    [ 'KeyY', 'Y' ],
    [ 'KeyU', 'U' ],
    [ 'KeyI', 'I' ],
    [ 'KeyO', 'O' ],
    [ 'KeyP', 'P' ],
    [ 'BracketLeft', 'BracketLeft' ],
    [ 'BracketRight', 'BracketRight' ],
    [ 'Backslash', 'Backslash' ],
    [ 'KeyA', 'A' ],
    [ 'KeyS', 'S' ],
    [ 'KeyD', 'D' ],
    [ 'KeyF', 'F' ],
    [ 'KeyG', 'G' ],
    [ 'KeyH', 'H' ],
    [ 'KeyJ', 'J' ],
    [ 'KeyK', 'K' ],
    [ 'KeyL', 'L' ],
    [ 'Semicolon', 'Semicolon' ],
    [ 'Quote', 'Quote' ],
    [ 'KeyZ', 'Z' ],
    [ 'KeyX', 'X' ],
    [ 'KeyC', 'C' ],
    [ 'KeyV', 'V' ],
    [ 'KeyB', 'B' ],
    [ 'KeyN', 'N' ],
    [ 'KeyM', 'M' ],
    [ 'Comma', 'Comma' ],
    [ 'Period', 'Period' ],
    [ 'Slash', 'Slash' ]
]);

/**
* Returns the currently focused element if it is not blacklisted.
*
* @returns {HTMLElement|null} - The currently focused element.
*/
export const getPriorityFocusedElement = (): HTMLElement | null =>
    document.querySelector(`:focus:is(${_elementsBlacklist.join(',')})`);

/**
* Returns the keyboard key from a KeyboardEvent.
*
* @param {KeyboardEvent} e - The KeyboardEvent.
* @returns {string} - The keyboard key.
*/
export const getKeyboardKey = (e: KeyboardEvent): string => {
    // @ts-ignore
    const { altKey, code, key, shiftKey, type, which, ctrlKey } = e;

    // In the codeMap, all characters that may vary depending on the keyboard layout
    // or the Alt key press are listed. Therefore, the key is identified by its code.
    const realKey = codeMap.get(code);

    if (realKey != undefined) {
        return altKey ? `:${realKey}` : realKey;
    }

    // If e.key is a string, then it is assumed it already plainly states
    // the key pressed. This may not be true in all cases, such as with Edge
    // and "?", when the browser cannot properly map a key press event to a
    // keyboard key. To be safe, when a key is "Unidentified" it must be
    // further analyzed by jitsi to a key using e.which.
    if (typeof key === 'string' && key !== 'Unidentified') {
        if (ctrlKey) {
            return `-${key}`;
        }

        return key;
    }

    if (type === 'keypress'
            && ((which >= 32 && which <= 126)
                || (which >= 160 && which <= 255))) {
        return String.fromCharCode(which);
    }

    // try to fallback (0-9A-Za-z and QWERTY keyboard)
    switch (which) {
    case 27:
        return 'Escape';
    case 191:
        return shiftKey ? '?' : '/';
    }

    if (shiftKey || type === 'keypress') {
        return String.fromCharCode(which);
    }

    return String.fromCharCode(which).toLowerCase();
};
