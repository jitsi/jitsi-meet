/**
 * Enumerates the supported keys.
 * NOTE: The maps represents physical keys on the keyboard, not chars.
 * @readonly
 * @enum {string}
 */
export const KEYS = {
    BACKSPACE: 'backspace',
    DELETE: 'delete',
    RETURN: 'enter',
    TAB: 'tab',
    ESCAPE: 'escape',
    UP: 'up',
    DOWN: 'down',
    RIGHT: 'right',
    LEFT: 'left',
    HOME: 'home',
    END: 'end',
    PAGEUP: 'pageup',
    PAGEDOWN: 'pagedown',

    F1: 'f1',
    F2: 'f2',
    F3: 'f3',
    F4: 'f4',
    F5: 'f5',
    F6: 'f6',
    F7: 'f7',
    F8: 'f8',
    F9: 'f9',
    F10: 'f10',
    F11: 'f11',
    F12: 'f12',
    META: 'command',
    CMD_L: 'command',
    CMD_R: 'command',
    ALT: 'alt',
    CONTROL: 'control',
    SHIFT: 'shift',
    CAPS_LOCK: 'caps_lock', // not supported by robotjs
    SPACE: 'space',
    PRINTSCREEN: 'printscreen',
    INSERT: 'insert',

    NUMPAD_0: 'numpad_0',
    NUMPAD_1: 'numpad_1',
    NUMPAD_2: 'numpad_2',
    NUMPAD_3: 'numpad_3',
    NUMPAD_4: 'numpad_4',
    NUMPAD_5: 'numpad_5',
    NUMPAD_6: 'numpad_6',
    NUMPAD_7: 'numpad_7',
    NUMPAD_8: 'numpad_8',
    NUMPAD_9: 'numpad_9',

    COMMA: ',',

    PERIOD: '.',
    SEMICOLON: ';',
    QUOTE: '\'',
    BRACKET_LEFT: '[',
    BRACKET_RIGHT: ']',
    BACKQUOTE: '`',
    BACKSLASH: '\\',
    MINUS: '-',
    EQUAL: '=',
    SLASH: '/'
};

/* eslint-disable max-len */
/**
 * Mapping between the key codes and keys deined in KEYS.
 * The mappings are based on
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode#Specifications
 */
/* eslint-enable max-len */
const keyCodeToKey = {
    8: KEYS.BACKSPACE,
    9: KEYS.TAB,
    13: KEYS.RETURN,
    16: KEYS.SHIFT,
    17: KEYS.CONTROL,
    18: KEYS.ALT,
    20: KEYS.CAPS_LOCK,
    27: KEYS.ESCAPE,
    32: KEYS.SPACE,
    33: KEYS.PAGEUP,
    34: KEYS.PAGEDOWN,
    35: KEYS.END,
    36: KEYS.HOME,
    37: KEYS.LEFT,
    38: KEYS.UP,
    39: KEYS.RIGHT,
    40: KEYS.DOWN,
    42: KEYS.PRINTSCREEN,
    44: KEYS.PRINTSCREEN,
    45: KEYS.INSERT,
    46: KEYS.DELETE,
    59: KEYS.SEMICOLON,
    61: KEYS.EQUAL,
    91: KEYS.CMD_L,
    92: KEYS.CMD_R,
    93: KEYS.CMD_R,
    96: KEYS.NUMPAD_0,
    97: KEYS.NUMPAD_1,
    98: KEYS.NUMPAD_2,
    99: KEYS.NUMPAD_3,
    100: KEYS.NUMPAD_4,
    101: KEYS.NUMPAD_5,
    102: KEYS.NUMPAD_6,
    103: KEYS.NUMPAD_7,
    104: KEYS.NUMPAD_8,
    105: KEYS.NUMPAD_9,
    112: KEYS.F1,
    113: KEYS.F2,
    114: KEYS.F3,
    115: KEYS.F4,
    116: KEYS.F5,
    117: KEYS.F6,
    118: KEYS.F7,
    119: KEYS.F8,
    120: KEYS.F9,
    121: KEYS.F10,
    122: KEYS.F11,
    123: KEYS.F12,
    124: KEYS.PRINTSCREEN,
    173: KEYS.MINUS,
    186: KEYS.SEMICOLON,
    187: KEYS.EQUAL,
    188: KEYS.COMMA,
    189: KEYS.MINUS,
    190: KEYS.PERIOD,
    191: KEYS.SLASH,
    192: KEYS.BACKQUOTE,
    219: KEYS.BRACKET_LEFT,
    220: KEYS.BACKSLASH,
    221: KEYS.BRACKET_RIGHT,
    222: KEYS.QUOTE,
    224: KEYS.META,
    229: KEYS.SEMICOLON
};

/**
 * Generate codes for digit keys (0-9)
 */
for (let i = 0; i < 10; i++) {
    keyCodeToKey[i + 48] = `${i}`;
}

/**
 * Generate codes for letter keys (a-z)
 */
for (let i = 0; i < 26; i++) {
    const keyCode = i + 65;

    keyCodeToKey[keyCode] = String.fromCharCode(keyCode).toLowerCase();
}

/**
 * Returns key associated with the keyCode from the passed event.
 * @param {KeyboardEvent} event the event
 * @returns {KEYS} the key on the keyboard.
 */
export function keyboardEventToKey(event) {
    return keyCodeToKey[event.which];
}
