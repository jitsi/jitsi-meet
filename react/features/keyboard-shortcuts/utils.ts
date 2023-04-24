
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
    // If alt is pressed a different char can be returned so this takes
    // the char from the code. It also prefixes with a colon to differentiate
    // alt combo from simple keypress.
    if (e.altKey) {
        const key = e.code.replace('Key', '');

        return `:${key}`;
    }

    // If e.key is a string, then it is assumed it already plainly states
    // the key pressed. This may not be true in all cases, such as with Edge
    // and "?", when the browser cannot properly map a key press event to a
    // keyboard key. To be safe, when a key is "Unidentified" it must be
    // further analyzed by jitsi to a key using e.which.
    if (typeof e.key === 'string' && e.key !== 'Unidentified') {
        return e.key;
    }
    if (e.type === 'keypress'
            && ((e.which >= 32 && e.which <= 126)
                || (e.which >= 160 && e.which <= 255))) {
        return String.fromCharCode(e.which);
    }

    // try to fallback (0-9A-Za-z and QWERTY keyboard)
    switch (e.which) {
    case 27:
        return 'Escape';
    case 191:
        return e.shiftKey ? '?' : '/';
    }

    if (e.shiftKey || e.type === 'keypress') {
        return String.fromCharCode(e.which);
    }

    return String.fromCharCode(e.which).toLowerCase();
};
